# Atlas Deployment Guide

This guide covers the production path for Atlas:

1. Host the web app.
2. Host the API server.
3. Connect Supabase and Supermemory.
4. Build desktop/Linux packages.

## Phase 2: Production Frontend/API Connection

The frontend automatically chooses its API mode:

- No `VITE_ATLAS_API_URL`: uses local Vite development endpoints.
- With `VITE_ATLAS_API_URL`: uses the production API server.

Set this on your hosted web app:

```bash
VITE_ATLAS_API_URL=https://your-atlas-api-domain.com
```

The API server validates Supabase bearer tokens when:

```bash
ATLAS_REQUIRE_AUTH=true
```

## Phase 3: Web Hosting

### Recommended Production Shape

Use two services:

- `atlas-web`: static Vite frontend.
- `atlas-api`: long-running Node container.

Do not host the full agent system as a static-only app. File writing, terminal commands, ZIP download, previews, and memory proxy calls need the API server.

### Vercel Frontend

The repo includes:

```txt
vercel.json
```

Use these settings:

```txt
Framework: Vite
Build command: npm run build --workspace=@apps/desktop
Output directory: apps/desktop/dist
Install command: npm ci
```

Required frontend env:

```bash
VITE_ATLAS_API_URL=https://your-atlas-api-domain.com
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_ANON_KEY=...
VITE_ATLAS_OPENROUTER_API_KEY=...
```

### Render

The repo includes:

```txt
render.yaml
```

Render can create:

- A Docker web service for `atlas-api`.
- A static site for `atlas-web`.

Set secret/env values in the Render dashboard after creating services.

### Railway

The repo includes:

```txt
railway.json
```

Railway will use:

```txt
apps/server/Dockerfile
```

Set these Railway variables:

```bash
NODE_ENV=production
PORT=8787
ATLAS_REQUIRE_AUTH=true
ATLAS_TERMINAL_ENABLED=true
ATLAS_ALLOWED_ORIGINS=https://your-atlas-web-domain.com
ATLAS_WORKSPACE_ROOT=/data/atlas-workspaces
SUPABASE_JWKS_URL=https://YOUR_PROJECT_REF.supabase.co/auth/v1/.well-known/jwks.json
SUPERMEMORY_API_KEY=...
```

Use persistent storage for `/data` if your host supports it.

### Fly.io

The repo includes:

```txt
fly.toml
```

First create the app/volume:

```bash
fly launch --no-deploy
fly volumes create atlas_workspaces --size 10 --region bom
```

Set secrets:

```bash
fly secrets set \
  ATLAS_ALLOWED_ORIGINS=https://your-atlas-web-domain.com \
  SUPABASE_JWKS_URL=https://YOUR_PROJECT_REF.supabase.co/auth/v1/.well-known/jwks.json \
  SUPERMEMORY_API_KEY=...
```

Deploy:

```bash
fly deploy
```

## Phase 4: Desktop and Linux App

Atlas has a Tauri shell in:

```txt
apps/desktop/src-tauri
```

Local Linux build command:

```bash
npm run build:desktop-app
```

Or directly:

```bash
npm run tauri:build --workspace=@apps/desktop
```

Linux output will be under:

```txt
apps/desktop/src-tauri/target/release/bundle
```

The repo also includes GitHub Actions:

```txt
.github/workflows/linux-desktop.yml
```

Run it manually from GitHub Actions to build Linux bundles in CI without consuming local disk.

## CI

The repo includes:

```txt
.github/workflows/ci.yml
```

It runs:

- API server syntax check.
- Desktop TypeScript check.
- Web production build.

## Production Warnings

- Keep `ATLAS_REQUIRE_AUTH=true` in production.
- Keep `ATLAS_ALLOWED_ORIGINS` restricted to your real frontend domain.
- Terminal execution should run only inside an isolated container.
- Do not expose Supabase secret/service-role keys to the browser.
- Use persistent backend storage for `ATLAS_WORKSPACE_ROOT`.
- Store all secrets in the hosting provider dashboard, not in git.
