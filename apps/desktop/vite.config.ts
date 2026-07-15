/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import JSZip from 'jszip';

const workspaceRoot = path.resolve(__dirname, '../../atlas-workspaces');
const envRoot = path.resolve(__dirname, '../..');
const execAsync = promisify(exec);

const readBody = async (req: any): Promise<any> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const sendJson = (res: any, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const resolveWorkspacePath = (projectId: string, inputPath = '') => {
  const projectRoot = path.resolve(workspaceRoot, projectId);
  const target = path.resolve(projectRoot, inputPath);
  if (target !== projectRoot && !target.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error('Path escapes project workspace');
  }
  return { projectRoot, target };
};

const listFiles = async (dir: string, root: string): Promise<Array<{ path: string; size: number; modifiedAt: number }>> => {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(entries.map(async entry => {
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

const contentTypeForPath = (filePath: string) => {
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

const rewritePreviewHtml = (html: string, projectId: string, filePath: string) => {
  const baseDir = path.posix.dirname(filePath).replace(/^\.$/, '');
  const rewriteAttr = (match: string, attr: string, quote: string, value: string) => {
    if (/^(https?:|data:|blob:|#|mailto:|tel:|\/)/i.test(value)) return match;
    const resolved = path.posix.normalize(path.posix.join(baseDir, value)).replace(/^\/+/, '');
    const rawUrl = `/__atlas_workspace/raw?projectId=${encodeURIComponent(projectId)}&path=${encodeURIComponent(resolved)}`;
    return `${attr}=${quote}${rawUrl}${quote}`;
  };

  const rewritten = html.replace(/\b(src|href)=("([^"]+)"|'([^']+)')/gi, (match, attr, wrapped, doubleValue, singleValue) => {
    const quote = wrapped.startsWith('"') ? '"' : "'";
    return rewriteAttr(match, attr, quote, doubleValue || singleValue || '');
  });

  const liveScript = `
<script>
  (() => {
    const poll = async () => {
      try {
        const res = await fetch('/__atlas_workspace/files?projectId=${encodeURIComponent(projectId)}');
        const data = await res.json();
        const stamp = (data.files || []).map(file => file.path + ':' + file.modifiedAt).join('|');
        if (window.__atlasPreviewStamp && window.__atlasPreviewStamp !== stamp) location.reload();
        window.__atlasPreviewStamp = stamp;
      } catch {}
    };
    setInterval(poll, 1200);
    poll();
  })();
</script>`;

  return rewritten.includes('</body>')
    ? rewritten.replace('</body>', `${liveScript}</body>`)
    : `${rewritten}${liveScript}`;
};

const atlasWorkspacePlugin = (supermemoryApiKey: string) => ({
  name: 'atlas-workspace-api',
  configureServer(server: any) {
    server.middlewares.use('/__atlas_memory', async (req: any, res: any) => {
      try {
        if (!supermemoryApiKey) {
          sendJson(res, 501, { error: 'SUPERMEMORY_API_KEY is not configured' });
          return;
        }

        const url = new URL(req.url || '/', 'http://atlas.local');

        if (req.method === 'POST' && url.pathname === '/add') {
          const body = await readBody(req);
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
          sendJson(res, upstream.ok ? 200 : upstream.status, payload);
          return;
        }

        if (req.method === 'GET' && url.pathname === '/search') {
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
          sendJson(res, upstream.ok ? 200 : upstream.status, payload);
          return;
        }

        sendJson(res, 404, { error: 'Unknown memory endpoint' });
      } catch (err: any) {
        sendJson(res, 400, { error: err?.message || 'Memory request failed' });
      }
    });

    server.middlewares.use('/__atlas_workspace', async (req: any, res: any) => {
      try {
        const url = new URL(req.url || '/', 'http://atlas.local');
        const projectId = url.searchParams.get('projectId') || 'default';

        if (req.method === 'GET' && url.pathname === '/files') {
          const { projectRoot } = resolveWorkspacePath(projectId);
          await fs.mkdir(projectRoot, { recursive: true });
          sendJson(res, 200, { files: await listFiles(projectRoot, projectRoot) });
          return;
        }

        if (req.method === 'GET' && url.pathname === '/read') {
          const filePath = url.searchParams.get('path') || '';
          const { target } = resolveWorkspacePath(projectId, filePath);
          const content = await fs.readFile(target, 'utf8');
          sendJson(res, 200, { content });
          return;
        }

        if (req.method === 'GET' && url.pathname === '/raw') {
          const filePath = url.searchParams.get('path') || '';
          const { target } = resolveWorkspacePath(projectId, filePath);
          const content = await fs.readFile(target);
          res.statusCode = 200;
          res.setHeader('Content-Type', contentTypeForPath(filePath));
          res.end(content);
          return;
        }

        if (req.method === 'GET' && url.pathname === '/preview') {
          const requestedPath = url.searchParams.get('path') || 'index.html';
          const { target } = resolveWorkspacePath(projectId, requestedPath);
          const html = await fs.readFile(target, 'utf8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(rewritePreviewHtml(html, projectId, requestedPath));
          return;
        }

        if (req.method === 'GET' && url.pathname === '/download.zip') {
          const { projectRoot } = resolveWorkspacePath(projectId);
          await fs.mkdir(projectRoot, { recursive: true });
          const files = await listFiles(projectRoot, projectRoot);
          const zip = new JSZip();
          await Promise.all(files.map(async file => {
            const { target } = resolveWorkspacePath(projectId, file.path);
            zip.file(file.path, await fs.readFile(target));
          }));
          const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename="${projectId}-workspace.zip"`);
          res.end(archive);
          return;
        }

        if (req.method === 'POST' && url.pathname === '/write') {
          const body = await readBody(req);
          const { projectRoot, target } = resolveWorkspacePath(projectId, String(body.path || ''));
          await fs.mkdir(projectRoot, { recursive: true });
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, String(body.content || ''), 'utf8');
          sendJson(res, 200, { path: path.relative(projectRoot, target).replace(/\\/g, '/') });
          return;
        }

        if (req.method === 'POST' && url.pathname === '/rename') {
          const body = await readBody(req);
          const fromPath = String(body.fromPath || '');
          const toPath = String(body.toPath || '');
          if (!fromPath || !toPath) throw new Error('Both fromPath and toPath are required');
          const { projectRoot, target: fromTarget } = resolveWorkspacePath(projectId, fromPath);
          const { target: toTarget } = resolveWorkspacePath(projectId, toPath);
          const samePath = fromTarget === toTarget;
          if (!samePath) {
            const existing = await fs.stat(toTarget).catch(() => null);
            if (existing) throw new Error(`Cannot rename: "${toPath}" already exists`);
          }
          await fs.mkdir(path.dirname(toTarget), { recursive: true });
          await fs.rename(fromTarget, toTarget);
          sendJson(res, 200, { path: path.relative(projectRoot, toTarget).replace(/\\/g, '/') });
          return;
        }

        if (req.method === 'POST' && url.pathname === '/delete') {
          const body = await readBody(req);
          const filePath = String(body.path || '');
          if (!filePath) throw new Error('File path is required');
          const { target } = resolveWorkspacePath(projectId, filePath);
          await fs.rm(target, { force: true });
          sendJson(res, 200, { path: filePath });
          return;
        }

        if (req.method === 'POST' && url.pathname === '/terminal') {
          const body = await readBody(req);
          const { projectRoot, target: cwd } = resolveWorkspacePath(projectId, String(body.cwd || ''));
          await fs.mkdir(projectRoot, { recursive: true });
          const command = String(body.command || '').trim();
          if (!command) throw new Error('Terminal command is required');

          try {
            const { stdout, stderr } = await execAsync(command, {
              cwd,
              timeout: 30000,
              maxBuffer: 1024 * 1024,
              shell: '/bin/bash'
            });
            sendJson(res, 200, { command, cwd: path.relative(projectRoot, cwd) || '.', exitCode: 0, output: [stdout, stderr].filter(Boolean).join('\n') });
          } catch (err: any) {
            sendJson(res, 200, {
              command,
              cwd: path.relative(projectRoot, cwd) || '.',
              exitCode: typeof err?.code === 'number' ? err.code : 1,
              output: [err?.stdout, err?.stderr, err?.message].filter(Boolean).join('\n')
            });
          }
          return;
        }

        sendJson(res, 404, { error: 'Unknown workspace endpoint' });
      } catch (err: any) {
        sendJson(res, 400, { error: err?.message || 'Workspace request failed' });
      }
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envRoot, '');

  return {
  envDir: envRoot,
  plugins: [react(), atlasWorkspacePlugin(env.SUPERMEMORY_API_KEY || process.env.SUPERMEMORY_API_KEY || '')],
  server: {
    port: 1420,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@atlas/agent-communication': path.resolve(__dirname, '../../packages/agent-communication/src/index.ts'),
      '@atlas/agent-registry': path.resolve(__dirname, '../../packages/agent-registry/src/index.ts'),
      '@atlas/agent-runtime': path.resolve(__dirname, '../../packages/agent-runtime/src/index.ts'),
      '@atlas/capability-engine': path.resolve(__dirname, '../../packages/capability-engine/src/index.ts'),
      '@atlas/config': path.resolve(__dirname, '../../packages/config/src/index.ts'),
      '@atlas/context-engine': path.resolve(__dirname, '../../packages/context-engine/src/index.ts'),
      '@atlas/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@atlas/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
      '@atlas/errors': path.resolve(__dirname, '../../packages/errors/src/index.ts'),
      '@atlas/intelligence-router': path.resolve(__dirname, '../../packages/intelligence-router/src/index.ts'),
      '@atlas/kernel': path.resolve(__dirname, '../../packages/kernel/src/index.ts'),
      '@atlas/logger': path.resolve(__dirname, '../../packages/logger/src/index.ts'),
      '@atlas/memory': path.resolve(__dirname, '../../packages/memory/src/index.ts'),
      '@atlas/metrics': path.resolve(__dirname, '../../packages/metrics/src/index.ts'),
      '@atlas/model-registry': path.resolve(__dirname, '../../packages/model-registry/src/index.ts'),
      '@atlas/provider-adapters': path.resolve(__dirname, '../../packages/provider-adapters/src/index.ts'),
      '@atlas/provider-cache': path.resolve(__dirname, '../../packages/provider-cache/src/index.ts'),
      '@atlas/provider-health': path.resolve(__dirname, '../../packages/provider-health/src/index.ts'),
      '@atlas/provider-registry': path.resolve(__dirname, '../../packages/provider-registry/src/index.ts'),
      '@atlas/provider-router': path.resolve(__dirname, '../../packages/provider-router/src/index.ts'),
      '@atlas/task-orchestrator': path.resolve(__dirname, '../../packages/task-orchestrator/src/index.ts'),
    },
  },
  build: {
    target: ['es2022', 'chrome100', 'safari15'],
    minify: false,
    sourcemap: true,
    commonjsOptions: {
      include: [/packages/, /node_modules/],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  }
  };
});
