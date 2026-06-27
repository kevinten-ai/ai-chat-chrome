# Repository Notes

This repository contains the `browser-use-hotel` project: a hotel price comparison demo where AI Browser Agents search Ctrip, Qunar, and Tongcheng, then stream screenshots and results to a Next.js frontend.

## Structure

- `hotel-compare/web/`: Next.js 16 static-export frontend for `hotel.rxcloud.group`.
- `hotel-compare/browser-use-version/`: Python worker using browser-use, Playwright, Supabase, and Volcengine Ark through an OpenAI-compatible LLM client.
- `hotel-compare/page-agent-version/`: Chrome extension/client-side Agent approach when present.
- `docs/`: research and implementation planning for browser-use, page-agent, GUI agents, and mobile agents.

## Working Rules

- Do not commit real `.env`, `.env.local`, Supabase service-role keys, LLM API keys, browser profiles, screenshots from private sessions, or cache directories.
- Keep frontend public Supabase variables in `hotel-compare/web/.env.local.example`.
- Keep worker secrets in `hotel-compare/browser-use-version/.env.example` only as placeholders; runtime LLM variables are `ARK_API_KEY`, `ARK_BASE_URL`, and `ARK_CHAT_MODEL`.
- Run frontend commands from `hotel-compare/web/`.
- Run worker commands from `hotel-compare/browser-use-version/`.
- Treat hotel platform automation as brittle: record whether failures are due to CAPTCHA, login walls, selector drift, or network issues.

## Validation

Frontend:

```bash
cd hotel-compare/web
npm run lint
npm run test
npm run type-check
npm run build
```

Worker:

```bash
cd hotel-compare/browser-use-version
uv run pytest
```

`uv run pytest` requires the Python environment and test dependencies to be available.
