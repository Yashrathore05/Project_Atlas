# Atlas

**A multi-agent coding workspace where AI agents collaborate inside one real project.**

Atlas is built for the workflow where one agent handles frontend, another handles backend, another reviews, and all of them work under the same project roof. It combines a modern web workspace, real file operations, terminal execution, live preview, Supabase persistence, and long-term memory.

![Atlas](./logo.png)

## What Atlas Does

- Create custom AI agents with names, roles, skills, tags, models, API keys, and MCP connector notes.
- Chat with each agent individually in movable, resizable windows.
- Run multi-agent collaboration tasks in one shared workspace.
- Let agents create, edit, rename, delete, and download real project files.
- Run terminal commands from agent workflows.
- Preview generated HTML projects live.
- Save projects, agents, settings, memory, decisions, and history through Supabase.
- Use OpenRouter, OpenAI, Anthropic, Groq, Ollama, or OpenAI-compatible providers.
- Use Supermemory to keep longer project context available.
- Prepare the same product for web hosting, desktop packaging, and Linux app distribution.

## Current Architecture

```txt
Project Atlas
├─ apps
│  ├─ desktop       React + Vite workspace UI
│  └─ server        Production Node API for workspace + memory operations
├─ packages         Internal Atlas engine/runtime/provider modules
├─ supabase         Database migrations
└─ atlas-workspaces Runtime project files, ignored by git
```

## Apps

### Web/Desktop UI

Path: `apps/desktop`

The UI includes:

- Landing page
- Supabase login/signup and Google auth flow
- Workspace dashboard
- Agent builder
- Team/project pages
- File explorer and editor
- Live preview
- Provider settings
- Memory and decision views
- Movable/resizable agent windows

### Production API

Path: `apps/server`

The backend provides:

- `GET /api/health`
- `GET /api/workspace/files`
- `GET /api/workspace/read`
- `GET /api/workspace/raw`
- `GET /api/workspace/preview`
- `GET /api/workspace/download.zip`
- `POST /api/workspace/write`
- `POST /api/workspace/rename`
- `POST /api/workspace/delete`
- `POST /api/workspace/terminal`
- `POST /api/memory/add`
- `GET /api/memory/search`

It is intentionally lightweight and uses Node built-ins where possible so it can run in a long-lived container on Railway, Render, Fly.io, or a VPS.

## Requirements

- Node.js 20+
- npm 10+
- Supabase project for auth and persistence
- Supermemory API key for long-term memory
- Optional provider keys such as OpenRouter/OpenAI/Anthropic/Groq

## Setup

```bash
npm install
cp .env.example .env.local
```

Then fill `.env.local`.

Important variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_ANON_KEY=
VITE_ATLAS_OPENROUTER_API_KEY=
VITE_ATLAS_API_URL=http://127.0.0.1:8787

SUPABASE_JWKS_URL=
SUPERMEMORY_API_KEY=
ATLAS_ALLOWED_ORIGINS=http://localhost:1420,http://127.0.0.1:1420
ATLAS_WORKSPACE_ROOT=./atlas-workspaces
ATLAS_REQUIRE_AUTH=false
ATLAS_TERMINAL_ENABLED=true
```

Never commit `.env.local`.

## Supabase

Apply the migration in:

```txt
supabase/migrations/20260715000000_atlas_workspace_state.sql
```

This stores the user workspace state so projects, agents, provider settings, history, decisions, and memory-related UI state survive refresh.

For production, set:

```bash
ATLAS_REQUIRE_AUTH=true
SUPABASE_JWKS_URL=https://YOUR_PROJECT_REF.supabase.co/auth/v1/.well-known/jwks.json
```

The API server validates Supabase access tokens when auth is enabled.

## Local Development

Run both frontend and backend:

```bash
npm run dev
```

Run only the web UI:

```bash
npm run dev:desktop
```

Run only the API:

```bash
npm run dev:server
```

Default URLs:

```txt
Web UI:  http://127.0.0.1:1420
API:     http://127.0.0.1:8787
```

## Build

Build all workspaces:

```bash
npm run build
```

Build the web UI:

```bash
npm run build --workspace=@apps/desktop
```

Build/check the API:

```bash
npm run build --workspace=@apps/server
```

## Hosting Plan

Atlas should be hosted as two services.

### 1. Frontend

Host `apps/desktop` as a Vite static app on Vercel, Netlify, Cloudflare Pages, or any static host.

Build command:

```bash
npm run build --workspace=@apps/desktop
```

Output directory:

```txt
apps/desktop/dist
```

Set:

```bash
VITE_ATLAS_API_URL=https://your-atlas-api-domain.com
```

### 2. Backend

Host `apps/server` on a long-running container provider such as Railway, Render, Fly.io, or a VPS.

Start command:

```bash
npm run start --workspace=@apps/server
```

Recommended production env:

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

Use persistent disk storage for `ATLAS_WORKSPACE_ROOT`.

## Desktop and Linux App

The repo includes a Tauri shell under:

```txt
apps/desktop/src-tauri
```

The current priority is the hosted web product. For desktop/Linux distribution, the next step is to harden the Tauri command layer and build installers.

Target outputs:

- Linux `.AppImage`
- Linux `.deb`
- Later Windows/macOS bundles

## Security Notes

- `.env.local` and all `.env.*` files are ignored except `.env.example`.
- Runtime workspaces are ignored through `atlas-workspaces`.
- Generated `dist` folders are ignored.
- In production, enable `ATLAS_REQUIRE_AUTH=true`.
- Restrict `ATLAS_ALLOWED_ORIGINS` to the deployed frontend domain.
- Terminal execution is powerful. Run the API in an isolated container with least privilege.
- Use persistent storage with per-user workspace separation.
- Do not expose Supabase secret/service-role keys to the frontend.

## Scripts

```bash
npm run bootstrap
npm run dev
npm run dev:desktop
npm run dev:server
npm run build
npm run test
```

## Status

Atlas is in active development. The core direction is:

1. Web app online
2. Production backend container
3. Supabase-backed persistence
4. Supermemory-backed long-term context
5. Desktop/Linux packaged app
6. Stronger multi-agent orchestration

## License

Private project unless a license is added.
