# Phase 5: Competitor Research UI — Enterprise Tab Interface

## Summary

Adds `/competitor-research` to the Nadakki dashboard with a 3-tab interface that consumes SpyFu Phases 1–4 on the production backend.

## What's New

- **Tab 1 — Quick Search**: Parallel Phase 1 calls (ads, keywords, PPC/SEO competitors, domain stats-all) with overview, tables, and split competitor lists.
- **Tab 2 — Deep Analysis**: Phase 3 `competitor-analysis` with confidence badge, cost/cache footer, bar chart, keyword counts, top ads sample, competitor lists; handles 429 with a clear message.
- **Tab 3 — Ask Anything**: Phase 4 chat with markdown replies, tool/confidence/cost UI, 422 example hints, 429 handling.
- **Usage widget**: Polls `GET /api/v1/spyfu/usage/{tenant}` every 30s with a colored progress bar.
- **Feature flag**: `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED` — default **off** (404 + hidden nav).

## Scope

- New route, client components, `SpyFuClient`, hooks, types, ES/EN copy, `DashboardLayout` nav (flag-gated).
- **41** Jest tests, all passing (`npm run test:run`).
- `npm run typecheck` and `npm run build` verified (including build with flag set to `true`).
- No backend changes.

## Testing notes

- Jest + Testing Library; HTTP client tests use **fetch mocks** (Vitest/MSW native bindings are blocked in the Windows agent environment; assertions match the same contracts).

## Deployment

See `docs/phase5/RUNBOOK_PHASE_5.md` for env vars, Vercel activation, and rollback.

## Rollback

Set `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED=false` in Vercel production and redeploy. With the flag off, the dashboard behavior matches pre-merge for this feature.

## Screenshots

Instructions: `docs/phase5/screenshots/README.md`.
