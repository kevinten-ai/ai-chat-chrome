# Deployment

## Production Map

- Live site: `https://hotel.rxcloud.group`
- GitHub: `kevinten-ai/browser-use-hotel`
- Frontend: `hotel-compare/web/`
- Worker: `hotel-compare/browser-use-version/`
- Database/storage: Supabase

## Frontend

The web frontend is a static-exported Next.js app.

```bash
cd hotel-compare/web
npm install
npm run lint
npm run test
npm run type-check
npm run build
```

Build output is `hotel-compare/web/dist/`.

Required public environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Worker

The browser-use worker polls pending Supabase tasks, runs platform-specific hotel searches, uploads screenshots to Supabase Storage, and writes `step_logs` plus `results`.

```bash
cd hotel-compare/browser-use-version
uv sync
uv run playwright install chromium
uv run pytest
uv run python worker.py
```

Required worker environment variables:

```env
ARK_API_KEY=...
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v3
ARK_CHAT_MODEL=doubao-seed-2-0-code-preview-260215
SUPABASE_URL=...
SUPABASE_KEY=...
```

Railway/Docker deployment uses `hotel-compare/browser-use-version/Dockerfile`.

## Database

Apply the Supabase migrations under `hotel-compare/supabase/` before running the frontend and worker together. The frontend expects at least:

- `tasks`
- `step_logs`
- `results`

Screenshots are expected to be available through Supabase Storage URLs written by the worker.

## Live Check

```bash
curl -I -L https://hotel.rxcloud.group
```

HTTP 200 only proves the static frontend is reachable. A full production check also needs a Supabase-backed task run and worker screenshot upload.
