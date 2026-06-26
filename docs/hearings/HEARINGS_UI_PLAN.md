# Hearings UI — Plan & Hypotheses (SUPERLOOP MAESTRO v2)

Planning record for the hearings calendar + KPIs frontend. Companion to
`HEARINGS_DASHBOARD_UI.md` (which documents the shipped behavior).

## Discovery (FASE 0)

- **Stack:** Next 16 App Router, React 19, TS 5. Data fetching = `@tanstack/react-query`
  v5 (legal uses it exclusively). Toast = `sonner` via `@/components/forge/ui/Toast`.
  No calendar library installed → dependency-free day-group view.
- **Legal routes** live under `app/(forge)/legal/` (route group `(forge)`).
- **API convention:** legal screens call the same-origin proxy `/api/legal/*`
  (`next.config.js` → `${backendUrl}/api/v1/legal/*`) with `X-Tenant-ID` from
  `useLegalEffectiveTenantId()`. No client-side Bearer, no hardcoded backend URL.
- **Roles:** `useAuth()` exposes `allRoles: RoleInfo[]` keyed by `role_key`
  (e.g. `legal_admin`). The literals `attorney`/`paralegal` are not real frontend
  role_keys today.
- **Reusable UI:** `LegalLoadingSkeleton`, `LegalEmptyState`, `LegalErrorState`,
  the legal `role="dialog"` overlay pattern, `sonner` toasts.
- **Tests:** live in `__tests__/legal/` with `QueryClientProvider` + `jest.mock`.

### Regression baseline (main)

`jest`: **1011 passed / 63 failed / 1074 total** (30 suites failing pre-existing).
`tsc --noEmit`: 0 errors. The rule: zero NEW reds.

## Hypotheses (FASE 1) — outcomes

- Confirmed: App Router (H1), auth client reused (H3), form/list/card/skeleton/empty/error
  patterns (H5–H10), Jest+RTL with mocked fetch/module (H11/H23), enums from `/config`
  (H13/H21), POST→201 HearingOut (H14), contract == OpenAPI (H26).
- Adjusted vs the original prompt (real contract wins, PRINCIPIO #0):
  - H2: route is `app/(forge)/legal/hearings` (not bare `app/legal/`).
  - H12: the legal module DOES send `X-Tenant-ID` (see security note in the UI doc);
    `tenant_id` is never in a request body.
  - H15: list response is `{ hearings, total }`.
  - H16: KPI fields differ; `/kpis` has no params.
  - H27: RBAC gating is cosmetic; backend 403 is the authority.

## Decisions

- **Auth:** reuse the legal `/api/legal` proxy + `X-Tenant-ID` (do not invent a new
  Bearer pattern). Same-origin → avoids CORS.
- **RBAC:** `canManageHearings(allRoles)` cosmetic gating; backend 403 governs.
- **Nav:** one "Audiencias" entry in `LegalSubNav.tsx` (the only shared-file edit;
  the global forge sidebar is intentionally left untouched).

## File map (additive-only)

```
app/(forge)/legal/hearings/page.tsx
components/legal/hearings/HearingsDashboard.tsx
components/legal/hearings/HearingsKpiCards.tsx
components/legal/hearings/HearingFilters.tsx
components/legal/hearings/HearingsListView.tsx
components/legal/hearings/HearingsCalendarView.tsx
components/legal/hearings/HearingCard.tsx
components/legal/hearings/HearingCreateDialog.tsx
components/legal/hearings/HearingStatusControl.tsx
components/legal/hearings/HearingStatusBadge.tsx
lib/legal/hearings/hearings-api.ts
lib/legal/hearings/hearings-types.ts
lib/legal/hearings/hearings-rbac.ts
lib/legal/hearings/hearings-format.ts
hooks/legal/useHearings.ts
__tests__/legal/hearings/*.test.ts(x)
docs/hearings/HEARINGS_DASHBOARD_UI.md
docs/hearings/HEARINGS_UI_PLAN.md
components/legal/LegalSubNav.tsx   # +1 nav entry (the only shared-file change)
```

## Rollback

Delete the new `hearings` folders/files above and revert the single `LegalSubNav.tsx`
nav line. No shared component is modified.
