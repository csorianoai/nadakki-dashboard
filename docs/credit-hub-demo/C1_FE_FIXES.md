# C1 — FE fixes + handoff path corrections

**Branch:** `fix/credit-hub-broken-panels-fe`  
**Date:** 2026-07-08

## Implemented (C1)

1. **Decoupled bank dashboard errors** — `queueError` and `analyticsError` are independent. Queue KPIs render when analytics fails; amber partial-warning + retry analytics only.
2. **Tenant fallback for queue/analytics/offers** — `useTenant()` exposes `apiTenantId` (session or `NEXT_PUBLIC_DEFAULT_TENANT_ID` only). Silent `DEFAULT_CREDIT_TENANT_ID` fallback is **not** used for credit API hooks.

## Advanced from C3 (no backend dependency)

| Removed | Replacement |
|---------|-------------|
| `lib/credit-hub/utils/nadakki-demo-tenant.ts` | — |
| `lib/credit-hub/demo/enrich-nadakki-demo-offers.ts` | Raw offers from API |
| `DEMO_BANKS` in `BankRanking.tsx` | ROADMAP empty + retry |
| `DEMO_PTI/LTV/REJECTIONS` in `RiskCreditPanel`, `BankOperationsHub` | ROADMAP empty copy |

## Handoff corrections for Claude Code (B1, D5)

Update `nadakki-ai-suite/docs/credit_hub_demo/HANDOFF_CURSOR.md`:

| Panel | Handoff (stale) | Frontend truth (verified) |
|-------|-----------------|---------------------------|
| **B1** Queue | `GET /api/bank/applications/queue` | `GET /api/v2/credit/applications/queue` via `bankClient.getQueue` → `chFetch` |
| **D5** Offers | `GET /api/v2/credit/applications/{id}/offers` | `GET /credit/applications/{id}/offers` via `offersClient` (Cap 11 mount **without** `/api/v2` prefix) |

Post-seed verification curls in handoff §5 should use the v2 queue path and `/credit/.../offers` path.

## Not touched (per scope)

- B2 expediente/full, B11 stipulations, B12 consent, G1 monthly goals
- C2 `DemoModeBanner` (awaits `is_demo` from backend)
