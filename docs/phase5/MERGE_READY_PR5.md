# Merge-ready checklist — Phase 5 (Competitor Research UI)

## Summary

Enterprise **Competitor Research** area: Quick Search (parallel Phase 1), Deep Analysis (Phase 3 aggregator), Ask Anything (Phase 4 chat), usage widget (Phase 2), gated by `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED`.

## Files created (high level)

- `app/competitor-research/` — page, client shell, tab components.
- `lib/api/spyfu-client.ts`, `lib/spyfu/normalize.ts`, `lib/i18n/competitor-research.ts`.
- `types/spyfu.ts`.
- `hooks/useCompetitorSearch.ts`, `useDeepAnalysis.ts`, `useChatConversation.ts`, `useSpyFuUsage.ts`.
- `tests/**` — Jest tests (see below).
- `docs/phase5/*` — audit, runbook, this file, screenshots README.
- `.env.example` — documents new public vars.
- `jest.config.js`, `jest.setup.tsx` — test runner.

## Files modified

- `components/layout/DashboardLayout.tsx` — conditional **Competitor Research** nav item.
- `package.json` — dependencies (`react-markdown`, `remark-gfm`, `react-hot-toast`), scripts (`test`, `test:run`, `typecheck`), Jest deps.

## Test evidence

- Command: `npm run test:run`
- **41 tests**, all passing (10 suites).
- `npm run typecheck` — clean.
- `npm run build` — succeeded with flag default from `.env.local` and again with `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED=true`.

## Screenshots

See `docs/phase5/screenshots/README.md` for local capture steps (not committed as binary assets in this environment).

## Deployment checklist

- [ ] Preview: confirm `/competitor-research` 404 when flag off; works when flag on.
- [ ] Production: set env vars, redeploy, smoke-test three tabs + usage widget.
- [ ] Rollback path understood (flag off → redeploy).
