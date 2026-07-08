# C3-bis — Remaining demo arrays + DemoModeBanner scaffold

**Branch:** `feat/credit-hub-remove-remaining-demo-arrays`

## Removed DEMO arrays

| Component | Before | After |
|-----------|--------|-------|
| `AuctionIntel.tsx` | `DEMO_WIN_BREAKDOWN`, `DEMO_LOST_REASONS`, fake MTD/concentration chips | Top metrics from `GET /api/v2/credit/analytics/auction-intel`; sub-panels ROADMAP empty; portfolio uses real `portfolio_value` / `applications_with_offers` only |
| `BankAnalystProductivity.tsx` | `DEMO_ANALYSTS`, hardcoded SLA/volume/approval fallbacks | Cohort charts from `analytics.cohort_analysis` when present; analyst load + SLA ROADMAP empty |

## Hooks

- `useAuctionIntel`, `useRiskDistributions` → `apiTenantId` (session tenant, no silent UUID fallback).

## DemoModeBanner (C2 pre-build)

- `components/forge/ui/DemoModeBanner.tsx` — pure `isDemo: boolean`.
- Wired in `CreditHubLayoutClient` via `tenantConfig.is_demo === true` (optional field on `TenantBranding` / `TenantBankingConfig`).
- Renders `null` until backend publishes `is_demo` on branding response.

## Orphan sweep

- `lib/credit-hub/demo/` — empty after C1 (no files to delete).

## Handback (only if auction-intel empty in prod with seed)

If authenticated smoke returns 200 with `total_offers: 0` despite seed:

```
GET /api/v2/credit/analytics/auction-intel
X-Tenant-ID: <session-tenant-uuid>
→ capture status + body
```

Sub-panels `win_rate_breakdown` and `lost_reason` aggregation are **not implemented** in backend O2.2 — ROADMAP is correct until API extends.
