# hotel-compare web

Static-exported Next.js frontend for the Browser Agent hotel comparison demo.

## Role

- Creates hotel search tasks in Supabase.
- Polls `tasks`, `step_logs`, and `results` every 3 seconds.
- Displays per-platform screenshots, Agent reasoning steps, and final price comparison results.
- Supports single-engine `browser-use` mode and dual-engine comparison mode.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run test
npm run type-check
npm run build
```

`next.config.ts` uses `output: "export"` and `distDir: "dist"`, so production output is static HTML/assets under `dist/`.

## Environment

Copy `.env.local.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These variables are public frontend values. Worker-side Supabase service-role keys and LLM keys belong in `hotel-compare/browser-use-version/.env`, not in this web app.

## Deployment

- Live site: `https://hotel.rxcloud.group`
- Frontend host: Vercel static output or any static host serving `dist/`
- Worker host: Railway/Docker Python worker
- Backend: Supabase PostgreSQL + Storage

See the repository-level `DEPLOYMENT.md` for the full frontend/worker/backend deployment map.
