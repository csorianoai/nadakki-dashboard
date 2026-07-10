# Network Cockpit — QA Checklist (F4)

**Date:** 2026-07-10  
**Branch stack:** `cockpit-ui/f1-shell-nivel1` → `f2` → `f3` → `f4`

## Build & CI

| Item | Evidence |
|------|----------|
| `npm run build:webpack` exit 0 | Run locally on `cockpit-ui/f4-qa-transversal` |
| `npx jest tests/cockpit` pass | `platform-fetch-separation.test.ts`, `querystring-filters.test.ts` |
| Helper separation grep | Test asserts no `chFetch` in `lib/cockpit/api/*` |

## Zero false greens

| Vista | Panel | Endpoint | Helper | Estado |
|-------|-------|----------|--------|--------|
| N1 | Salud red | `/observability/v1/network/health` | platformFetch | DEMO si 404 |
| N1 | Cores grid | `/observability/v1/cores/summary` | platformFetch | DEMO si 404 |
| N1 | Actividad | `/observability/v1/activity` | platformFetch | DEMO si 404 |
| N1 | Alertas | `/observability/v1/alerts` | platformFetch | DEMO si 404 |
| N2 | KPIs + charts | `/credit-hub/v1/dashboard` | platformFetch | DEMO si 404 |
| N2 | Cola | `/credit-hub/v1/requests` | platformFetch | DEMO si 404 |
| N2 | AML | `/credit-hub/v1/compliance/aml` | platformFetch | DEMO si 404 |
| N2 | Ranking | `/credit-hub/v1/dealers/ranking` | platformFetch | DEMO si 404 |
| N2 | Audit | `/credit-hub/v1/audit-trail` | platformFetch | DEMO si 404 |
| N2 | Export Excel | `/api/v2/credit/bank/export/queue.xlsx` | tenant chFetch path | Solo con tenant filter |
| N3 | Tenants | `/tenant-admin/v1/tenants` | platformFetch | DEMO si 404 |
| N3 | Usuarios | `/auth-users/v1/users` | platformFetch | Empty si 404 |
| N3 | Suscripciones | `/observability/v1/usage` | platformFetch | DEMO si 404 |

## Auth & roles

| Item | Status |
|------|--------|
| `CHAdminAccessGuard` on admin layout | ✅ |
| 401 → redirect login (`platformFetch`) | ✅ |
| 403 → guard UI | ✅ |
| `tenant_admin` — platform section hidden | ✅ SubscriptionsPanel |
| `tenant_admin` — tenant filter locked | ✅ CockpitContext |
| Password reset token not in localStorage | ✅ React state only |

## UX

| Item | Status |
|------|--------|
| ROADMAP stub tiles removed | ✅ `AdminNetworkOsView` unused |
| Topbar tenant selector propagates | ✅ CockpitContext |
| Admin bypasses bank sidebar | ✅ `CreditHubLayoutClient` |
| Responsive single column | ✅ grid `sm:` / `lg:` breakpoints |
| Each N2 panel error boundary | ✅ `CockpitErrorBoundary` |

## Manual smoke (post-deploy)

- [ ] Login as `platform_superadmin` → N1 renders with live or DEMO badges
- [ ] Click credit_hub core card → N2
- [ ] N3 wizard create tenant → 409 slug inline error
- [ ] Reset password → token modal + copy, close clears state
