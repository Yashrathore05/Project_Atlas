# Atlas API Server

Production backend for Atlas workspace operations.

## Run locally

```bash
npm run dev --workspace=@apps/server
```

Health check:

```bash
curl http://127.0.0.1:8787/api/health
```

## Production env

Set these on Railway, Render, Fly.io, or your VPS:

```bash
NODE_ENV=production
PORT=8787
ATLAS_ALLOWED_ORIGINS=https://your-atlas-web-domain.com
ATLAS_WORKSPACE_ROOT=/data/atlas-workspaces
ATLAS_REQUIRE_AUTH=true
ATLAS_TERMINAL_ENABLED=true
SUPABASE_JWKS_URL=https://YOUR_PROJECT_REF.supabase.co/auth/v1/.well-known/jwks.json
SUPERMEMORY_API_KEY=...
```

For the web frontend:

```bash
VITE_ATLAS_API_URL=https://your-atlas-api-domain.com
```

## Endpoints

- `GET /api/health`
- `GET /api/workspace/files?projectId=...`
- `GET /api/workspace/read?projectId=...&path=...`
- `GET /api/workspace/raw?projectId=...&path=...`
- `GET /api/workspace/preview?projectId=...&path=...`
- `GET /api/workspace/download.zip?projectId=...`
- `POST /api/workspace/write?projectId=...`
- `POST /api/workspace/rename?projectId=...`
- `POST /api/workspace/delete?projectId=...`
- `POST /api/workspace/terminal?projectId=...`
- `POST /api/memory/add`
- `GET /api/memory/search?q=...`

When `ATLAS_REQUIRE_AUTH=true`, send the Supabase access token:

```bash
Authorization: Bearer <supabase-access-token>
```
