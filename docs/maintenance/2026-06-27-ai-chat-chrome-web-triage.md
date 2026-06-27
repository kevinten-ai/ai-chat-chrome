# ai-chat-chrome Web Triage - 2026-06-27

## Repository

- GitHub: `kevinten-ai/browser-use-hotel`
- Live site: `https://hotel.rxcloud.group`
- Frontend: Next.js 16 static export under `hotel-compare/web/`
- Worker: Python/browser-use/Playwright under `hotel-compare/browser-use-version/`
- Backend: Supabase PostgreSQL + Storage

## Public Route Check

- `https://hotel.rxcloud.group`: HTTP 200, served by Vercel

## Local State

- Local `main` was fast-forwarded to the remote Ark migration commit before applying this maintenance pass.
- Ignored local artifacts include `.next/`, `.playwright-mcp/`, worker `.env`, worker caches, frontend `.env.local`, frontend `.next/`, frontend `.vercel/`, frontend `dist/`, frontend `node_modules/`, and TypeScript build info.
- `hotel-compare/web/.env.local.example` existed locally but was ignored by `.env*`; it is now explicitly allowed.

## Actions Taken

- Added root `AGENTS.md` documenting the frontend/worker split and validation rules.
- Added root `DEPLOYMENT.md` covering Vercel/static frontend, Railway/Docker worker, Supabase, and live checks.
- Replaced the default Next template README in `hotel-compare/web/README.md`.
- Updated web scripts:
  - `lint`: `eslint`
  - `test`: `npm run lint`
  - `type-check`: `tsc --noEmit`
- Updated `hotel-compare/web/.gitignore` so `.env.local.example` can be committed.
- Updated ESLint ignores for generated `.vercel/` and `dist/` output.
- Fixed `EngineComparisonTable` so React hooks are not called after a conditional return.
- Removed a remaining explicit `any` from the lazy Supabase client proxy.
- Updated deployment notes so the worker uses `ARK_API_KEY`, `ARK_BASE_URL`, and `ARK_CHAT_MODEL`.
- `uv run pytest` updated `hotel-compare/browser-use-version/uv.lock` to match the current worker dependency graph.

## Follow-Up

- Add real frontend tests around task creation, polling, dual-engine filtering, and result rendering.
- Add a production smoke test that creates a Supabase task and verifies worker-written screenshots/results.
- Keep CAPTCHA/login-wall/platform selector drift notes tied to the worker retry/reflection code.

## Validation

- `cd hotel-compare/web && npm run lint`: passed
- `cd hotel-compare/web && npm run test`: passed
- `cd hotel-compare/web && npm run type-check`: passed
- `cd hotel-compare/web && npm run build`: passed
- `cd hotel-compare/browser-use-version && uv run --extra test pytest`: passed, 72 tests
- `git diff --check`: passed
- `scan_project.sh .`: passed with no legacy provider markers
- Staged additions old provider/secret scan: passed
- Real Ark worker `create_default_llm().ainvoke(...)` smoke: `ok=True`, `completion_length=38`, `has_usage=True`, `stop_reason=stop`

## Deployment

No redeploy was needed for this local maintenance sync. The Ark runtime migration, Vercel frontend deployment, production alias, and browser console verification are recorded in the workspace migration checklist. The Railway worker still needs authenticated access before end-to-end production hotel task execution can be rechecked.
