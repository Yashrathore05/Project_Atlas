import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createPublicKey, verify as verifySignature } from 'node:crypto';
import JSZip from 'jszip';

const execAsync = promisify(exec);

const PORT = Number(process.env.PORT || process.env.ATLAS_SERVER_PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const repoRoot = path.resolve(process.cwd(), '../..');
const workspaceRoot = path.resolve(process.env.ATLAS_WORKSPACE_ROOT || path.join(repoRoot, 'atlas-workspaces'));
const supermemoryApiKey = process.env.SUPERMEMORY_API_KEY || '';
const supabaseJwksUrl = process.env.SUPABASE_JWKS_URL || '';
const requireAuth = process.env.ATLAS_REQUIRE_AUTH === 'true' || (process.env.NODE_ENV === 'production' && !!supabaseJwksUrl);
const terminalEnabled = process.env.ATLAS_TERMINAL_ENABLED === 'true' || process.env.NODE_ENV !== 'production';
const commandTimeoutMs = Number(process.env.ATLAS_COMMAND_TIMEOUT_MS || 30000);
const commandMaxBuffer = Number(process.env.ATLAS_COMMAND_MAX_BUFFER || 1024 * 1024);
const allowedOrigins = (process.env.ATLAS_ALLOWED_ORIGINS || 'http://localhost:1420,http://127.0.0.1:1420')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

let jwksCache = { expiresAt: 0, keys: [] };

const json = (res, status, payload, extraHeaders = {}) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
};

const text = (res, status, payload, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) => {
  res.writeHead(status, { 'Content-Type': contentType, ...extraHeaders });
  res.end(payload);
};

const parseJsonBody = async req => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 10 * 1024 * 1024) throw new Error('Request body is too large');
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const base64UrlDecode = value => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
};

const getJwks = async () => {
  if (!supabaseJwksUrl) throw new Error('SUPABASE_JWKS_URL is not configured');
  if (Date.now() < jwksCache.expiresAt && jwksCache.keys.length) return jwksCache.keys;

  const response = await fetch(supabaseJwksUrl);
  if (!response.ok) throw new Error(`JWKS fetch failed: ${response.status}`);
  const body = await response.json();
  jwksCache = {
    expiresAt: Date.now() + 5 * 60 * 1000,
    keys: Array.isArray(body.keys) ? body.keys : []
  };
  return jwksCache.keys;
};

const verifySupabaseJwt = async token => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw new Error('Invalid bearer token');

  const header = JSON.parse(base64UrlDecode(encodedHeader).toString('utf8'));
  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8'));
  if (!payload.sub) throw new Error('Token has no subject');
  if (payload.exp && payload.exp * 1000 <= Date.now()) throw new Error('Token expired');

  const keys = await getJwks();
  const jwk = keys.find(key => key.kid === header.kid);
  if (!jwk) throw new Error('Signing key not found');

  const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
  const algorithm = header.alg === 'ES256' ? 'SHA256' : 'RSA-SHA256';
  const valid = verifySignature(
    algorithm,
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    publicKey,
    base64UrlDecode(encodedSignature)
  );
  if (!valid) throw new Error('Invalid token signature');

  return {
    userId: String(payload.sub),
    email: payload.email ? String(payload.email) : undefined,
    role: payload.role ? String(payload.role) : undefined
  };
};

const getAuthContext = async (req, url) => {
  if (!requireAuth) return { userId: 'local-dev' };
  const authorization = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const queryToken = url?.searchParams?.get('access_token');
  const token = match?.[1] || queryToken;
  if (!token) throw new Error('Missing Authorization bearer token');
  return verifySupabaseJwt(token);
};

const safeSegment = value => String(value || 'default').replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 100) || 'default';

const resolveWorkspacePath = (auth, projectId, inputPath = '') => {
  const userSegment = safeSegment(auth.userId);
  const projectSegment = safeSegment(projectId);
  const projectRoot = path.resolve(workspaceRoot, userSegment, projectSegment);
  const target = path.resolve(projectRoot, inputPath);
  if (target !== projectRoot && !target.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error('Path escapes project workspace');
  }
  return { projectRoot, target, projectSegment };
};

const listFiles = async (dir, root) => {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(entries.map(async entry => {
    if (entry.name === 'node_modules' || entry.name === '.git') return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, root);
    const stat = await fs.stat(full);
    return [{
      path: path.relative(root, full).replace(/\\/g, '/'),
      size: stat.size,
      modifiedAt: stat.mtimeMs
    }];
  }));
  return nested.flat().sort((a, b) => a.path.localeCompare(b.path));
};

const contentTypeForPath = filePath => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js' || ext === '.mjs') return 'text/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'text/plain; charset=utf-8';
};

const rewritePreviewHtml = (html, projectId, filePath, accessToken = '') => {
  const baseDir = path.posix.dirname(filePath).replace(/^\.$/, '');
  const rewriteAttr = (match, attr, quote, value) => {
    if (/^(https?:|data:|blob:|#|mailto:|tel:|\/)/i.test(value)) return match;
    const resolved = path.posix.normalize(path.posix.join(baseDir, value)).replace(/^\/+/, '');
    const tokenQuery = accessToken ? `&access_token=${encodeURIComponent(accessToken)}` : '';
    const rawUrl = `/api/workspace/raw?projectId=${encodeURIComponent(projectId)}&path=${encodeURIComponent(resolved)}${tokenQuery}`;
    return `${attr}=${quote}${rawUrl}${quote}`;
  };

  return html.replace(/\b(src|href)=("([^"]+)"|'([^']+)')/gi, (match, attr, wrapped, doubleValue, singleValue) => {
    const quote = wrapped.startsWith('"') ? '"' : "'";
    return rewriteAttr(match, attr, quote, doubleValue || singleValue || '');
  });
};

const setCors = (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigin = origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) ? origin : allowedOrigins[0];
  if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
};

const handleMemory = async (req, res, url) => {
  if (!supermemoryApiKey) {
    json(res, 501, { error: 'SUPERMEMORY_API_KEY is not configured' });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/memory/add') {
    const body = await parseJsonBody(req);
    const upstream = await fetch('https://api.supermemory.ai/v3/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supermemoryApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: String(body.content || ''),
        customId: body.customId,
        metadata: body.metadata || {},
        containerTags: Array.isArray(body.containerTags) ? body.containerTags : []
      })
    });
    const payload = await upstream.json().catch(() => ({}));
    json(res, upstream.ok ? 200 : upstream.status, payload);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/memory/search') {
    const query = url.searchParams.get('q') || '';
    const limit = Number(url.searchParams.get('limit') || '8');
    const upstream = await fetch('https://api.supermemory.ai/v4/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supermemoryApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query, limit })
    });
    const payload = await upstream.json().catch(() => ({}));
    json(res, upstream.ok ? 200 : upstream.status, payload);
    return;
  }

  json(res, 404, { error: 'Unknown memory endpoint' });
};

const handleWorkspace = async (req, res, url, auth) => {
  const projectId = url.searchParams.get('projectId') || 'default';

  if (req.method === 'GET' && url.pathname === '/api/workspace/files') {
    const { projectRoot } = resolveWorkspacePath(auth, projectId);
    await fs.mkdir(projectRoot, { recursive: true });
    json(res, 200, { files: await listFiles(projectRoot, projectRoot) });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/workspace/read') {
    const filePath = url.searchParams.get('path') || '';
    const { target } = resolveWorkspacePath(auth, projectId, filePath);
    json(res, 200, { content: await fs.readFile(target, 'utf8') });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/workspace/raw') {
    const filePath = url.searchParams.get('path') || '';
    const { target } = resolveWorkspacePath(auth, projectId, filePath);
    res.writeHead(200, { 'Content-Type': contentTypeForPath(filePath) });
    createReadStream(target).pipe(res);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/workspace/preview') {
    const requestedPath = url.searchParams.get('path') || 'index.html';
    const { target } = resolveWorkspacePath(auth, projectId, requestedPath);
    text(res, 200, rewritePreviewHtml(await fs.readFile(target, 'utf8'), projectId, requestedPath, url.searchParams.get('access_token') || ''), 'text/html; charset=utf-8');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/workspace/download.zip') {
    const { projectRoot, projectSegment } = resolveWorkspacePath(auth, projectId);
    await fs.mkdir(projectRoot, { recursive: true });
    const files = await listFiles(projectRoot, projectRoot);
    const zip = new JSZip();
    await Promise.all(files.map(async file => {
      const { target } = resolveWorkspacePath(auth, projectId, file.path);
      zip.file(file.path, await fs.readFile(target));
    }));
    const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${projectSegment}-workspace.zip"`
    });
    res.end(archive);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/workspace/write') {
    const body = await parseJsonBody(req);
    const { projectRoot, target } = resolveWorkspacePath(auth, projectId, String(body.path || ''));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, String(body.content || ''), 'utf8');
    json(res, 200, { path: path.relative(projectRoot, target).replace(/\\/g, '/') });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/workspace/rename') {
    const body = await parseJsonBody(req);
    const fromPath = String(body.fromPath || '');
    const toPath = String(body.toPath || '');
    if (!fromPath || !toPath) throw new Error('Both fromPath and toPath are required');
    const { projectRoot, target: fromTarget } = resolveWorkspacePath(auth, projectId, fromPath);
    const { target: toTarget } = resolveWorkspacePath(auth, projectId, toPath);
    if (fromTarget !== toTarget) {
      const existing = await fs.stat(toTarget).catch(() => null);
      if (existing) throw new Error(`Cannot rename: "${toPath}" already exists`);
    }
    await fs.mkdir(path.dirname(toTarget), { recursive: true });
    await fs.rename(fromTarget, toTarget);
    json(res, 200, { path: path.relative(projectRoot, toTarget).replace(/\\/g, '/') });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/workspace/delete') {
    const body = await parseJsonBody(req);
    const filePath = String(body.path || '');
    if (!filePath) throw new Error('File path is required');
    const { target } = resolveWorkspacePath(auth, projectId, filePath);
    await fs.rm(target, { force: true });
    json(res, 200, { path: filePath });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/workspace/terminal') {
    if (!terminalEnabled) throw new Error('Terminal execution is disabled on this server');
    const body = await parseJsonBody(req);
    const { projectRoot, target: cwd } = resolveWorkspacePath(auth, projectId, String(body.cwd || ''));
    await fs.mkdir(projectRoot, { recursive: true });
    await fs.mkdir(cwd, { recursive: true });
    const command = String(body.command || '').trim();
    if (!command) throw new Error('Terminal command is required');

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: commandTimeoutMs,
        maxBuffer: commandMaxBuffer,
        shell: '/bin/bash',
        env: {
          ...process.env,
          ATLAS_PROJECT_ROOT: projectRoot
        }
      });
      json(res, 200, { command, cwd: path.relative(projectRoot, cwd) || '.', exitCode: 0, output: [stdout, stderr].filter(Boolean).join('\n') });
    } catch (err) {
      json(res, 200, {
        command,
        cwd: path.relative(projectRoot, cwd) || '.',
        exitCode: typeof err?.code === 'number' ? err.code : 1,
        output: [err?.stdout, err?.stderr, err?.message].filter(Boolean).join('\n')
      });
    }
    return;
  }

  json(res, 404, { error: 'Unknown workspace endpoint' });
};

const server = http.createServer(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'atlas.local'}`);

    if (req.method === 'GET' && url.pathname === '/api/health') {
      json(res, 200, {
        ok: true,
        auth: requireAuth ? 'supabase-jwt' : 'disabled',
        terminal: terminalEnabled ? 'enabled' : 'disabled',
        workspaceRoot
      });
      return;
    }

    if (url.pathname.startsWith('/api/memory/')) {
      await getAuthContext(req, url);
      await handleMemory(req, res, url);
      return;
    }

    if (url.pathname.startsWith('/api/workspace/')) {
      const auth = await getAuthContext(req, url);
      await handleWorkspace(req, res, url, auth);
      return;
    }

    json(res, 404, { error: 'Unknown endpoint' });
  } catch (err) {
    const message = err?.message || 'Request failed';
    const status = /authorization|token|signature|expired|jwks/i.test(message) ? 401 : 400;
    json(res, status, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Atlas API listening on http://${HOST}:${PORT}`);
  console.log(`Workspace root: ${workspaceRoot}`);
  console.log(`Auth: ${requireAuth ? 'required' : 'disabled'} | Terminal: ${terminalEnabled ? 'enabled' : 'disabled'}`);
});
