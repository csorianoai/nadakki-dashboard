# Phase 5 Runbook — Competitor Research UI

## Feature flag

| Variable | Default | Effect |
|----------|---------|--------|
| `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED` | unset / not `true` | `/competitor-research` returns **404** (`notFound()`). Sidebar item **hidden**. |
| `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED=true` | on | Route and **Competitor Research** nav entry under **PUBLICIDAD** are active. |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend base (e.g. `https://nadakki-ai-suite.onrender.com`). |
| `NEXT_PUBLIC_DEFAULT_TENANT_ID` | Fallback `X-Tenant-ID` when no tenant is selected in the app shell. |
| `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED` | Gate for this feature (see above). |

See `.env.example` for a template.

## Activate in production (Vercel)

1. Project → **Settings** → **Environment Variables**.
2. Set `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED` to `true` for **Production** (and Preview if desired).
3. Ensure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_DEFAULT_TENANT_ID` match your pilot/backend.
4. **Redeploy** the production deployment so the new public env vars are inlined in the client bundle.

## Rollback

### Level 1 (fastest)

Set `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED=false` (or remove it) in Vercel **Production**, redeploy. Users get 404 on `/competitor-research`; nav link disappears after rebuild.

### Level 2

`git revert <merge-commit-sha>` on `main`, push; Vercel redeploys. No backend changes in this phase.

## API endpoints consumed

- **Phase 1**: `GET .../spyfu/ads|keywords|competitors|seo-competitors|domain-stats-all/{domain}` (plus query params as implemented in `lib/api/spyfu-client.ts`).
- **Phase 2**: `GET .../spyfu/usage/{tenant_id}` (polled every 30s in UI).
- **Phase 3**: `POST .../spyfu/intelligence/competitor-analysis`.
- **Phase 4**: `POST .../spyfu/chat`.

All requests send `X-Tenant-ID` and `Content-Type: application/json` as implemented in `SpyFuClient`.

## Known limitations

- **Lint**: `next lint` may fail on some Next 16 + monorepo root setups; `npm run typecheck` and `npm run build` are the authoritative checks used for this PR.
- **Screenshots**: Stored under `docs/phase5/screenshots/` (see README there); capture locally with the flag on and a running dev server.
- **Tests**: Jest + fetch mocks for the HTTP client (not MSW) due to native binding restrictions in the local agent environment.
