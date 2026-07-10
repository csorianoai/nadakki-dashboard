# F0 — Network Cockpit Frontend Recon

**Date:** 2026-07-10  
**Repo:** nadakki-dashboard  
**Scope:** Replace `/credit-hub/admin` stub with 3-level Network Cockpit.

---

## 1. Current stub (`/credit-hub/admin`)

| Item | Finding |
|------|---------|
| Route file | `app/(forge)/credit-hub/admin/page.tsx` |
| Guard | `CHAdminAccessGuard` — roles `platform_superadmin` \| `tenant_admin` only |
| Layout parent | `CreditHubLayoutClient` → `ForgeCreditHubAppShell` (bank persona sidebar — mismatch) |
| Component | `AdminNetworkOsView` — 7 static ROADMAP tiles + tenant card |
| APIs consumed | Indirect `GET /api/v2/tenants/{slug}/branding` via `useTenantConfig` → `useTenantBranding` |
| Sub-routes | None |
| `app/credit-hub/admin/` | Does not exist (only forge route group) |

---

## 2. Fetch helpers

| Helper | Location | Headers | Use |
|--------|----------|---------|-----|
| `chFetch` | `lib/credit-hub/api/client.ts` | `Authorization`, **`X-Tenant-ID`**, `X-Actor-Role` | Tenant-scoped `/api/v2/credit/*` |
| `useTenantBranding` | `lib/hooks/useTenantBranding.ts` | Bearer only | `GET /api/v2/tenants/{id}/branding` |
| `fetchTenantBranding` | `lib/credit-hub/api/tenant-branding-client.ts` | Bearer + optional tenant | Branding with 403/5xx classes |
| **NEW** `platformFetch` | `lib/platformApi.ts` (F1) | Bearer only, **no X-Tenant-ID** | `/observability/v1/*`, `/tenant-admin/v1/*`, `/auth-users/v1/*`, `/credit-hub/v1/*` |

**Bearer chain:** `tokenStorage.getAccessToken()` → fallback `localStorage.nadakki_sic_token` (same as `chFetch`).

**Browser base URL:** empty string → same-origin relative paths via Next.js rewrites/BFF.

**Separation rule:** `platformApi.ts` must not import `lib/credit-hub/api/client.ts`. CI test greps enforce prefix isolation.

---

## 3. Charts & reusable UI

| Asset | Location | Notes |
|-------|----------|-------|
| recharts `^3.6.0` | `package.json` | Used in `BankAnalyticsCharts.tsx`, admin observability, contable |
| `DataTruthBadge` | `components/credit-hub/honesty/DataTruthBadge.tsx` | REAL / DEMO / ROADMAP / SANDBOX |
| Tables | Bank queue, audit tables, `AuditTrailTable` | Pattern for nivel 2 cola |
| Wizards | `SaasOnboardingWizard`, dealer wizard steps | Multi-step pattern for tenant wizard |
| `ForgeButton`, `Skeleton` | `components/forge/ui/*` | Loading / actions |

---

## 4. Tenant selector

| Component | Path | API |
|-----------|------|-----|
| `TenantSelector` | `components/ui/TenantSelector.tsx` | `tenantsAPI.getListForSelector()` → fallback `/api/tenants` |
| Context | `contexts/TenantContext.tsx` | `tenantId` in `localStorage` key `nadakki_tenant_id` |
| Credit Hub | `lib/credit-hub/hooks/useTenant.ts` | Session tenant from `TenantContext` |

**Cockpit plan:** dedicated topbar selector — `null` = "Toda la red" (network scope); specific id filters tenant-scoped panels only.

---

## 5. Branding schema (exact keys)

### Source of truth: `TenantBranding` (`lib/credit-hub/types/tenantBranding.ts`)

Consumed by `useTenantBranding` / `adaptBrandingToConfigShape`:

| API field | Consumed as | Wizard Nivel 3 emit |
|-----------|-------------|---------------------|
| `display_name` | `institution_name` | `display_name` (1–80 chars) |
| `logo_url` | `branding.logo_url` | `logo_url` (valid URL or null) |
| `brand_primary` | `branding.primary_color` | **`brand_primary`** hex `^#[0-9A-Fa-f]{6}$` |
| `brand_dark` | `branding.secondary_color` | optional on edit |
| `locale` | `locale` | paso 1 |
| `currency` | `currency_code` | paso 1 |

**Note:** Spec mentions `primary_color`; existing contract uses **`brand_primary`** in API JSON. Wizard maps UI label "Color primario" → `brand_primary` on submit (not `primary_color`).

**Not in wizard paso 2 minimum:** `application_status_labels`, `copy_overrides`, `regulatory_profile` — inherited from tenant defaults on create.

---

## 6. Auth roles (cockpit)

| Role | Nivel 1–2 | Nivel 3 |
|------|-----------|---------|
| `platform_superadmin` | Full network | Full platform mgmt |
| `tenant_admin` | Read network (if guard allows) | Own tenant + users only; no subscriptions / plan toggles |

Guard: existing `CHAdminAccessGuard` + `CockpitContext` role gates in F3.

---

## 7. Backend endpoints (cockpit loop — frontend expects)

| Endpoint | Helper | UI level |
|----------|--------|----------|
| `GET /observability/v1/network/health` | platformFetch | N1 |
| `GET /observability/v1/cores/summary` | platformFetch | N1 |
| `GET /observability/v1/activity?limit=10` | platformFetch | N1 |
| `GET /observability/v1/alerts?status=open` | platformFetch | N1 |
| `GET /credit-hub/v1/dashboard` | platformFetch | N2 |
| `GET /credit-hub/v1/requests?scope=network` | platformFetch | N2 |
| `GET /credit-hub/v1/compliance/aml?period=today` | platformFetch | N2 |
| `GET /credit-hub/v1/dealers/ranking?limit=5` | platformFetch | N2 |
| `GET /credit-hub/v1/audit-trail?limit=10` | platformFetch | N2 |
| `GET /tenant-admin/v1/tenants` | platformFetch | N3 |
| `POST/PATCH /tenant-admin/v1/tenants` | platformFetch | N3 |
| `GET /tenant-admin/v1/plans` | platformFetch | N3 |
| `GET /tenant-admin/v1/cores/registry` | platformFetch | N3 |
| `GET /auth-users/v1/users` | platformFetch | N3 |
| `GET /auth-users/v1/roles` | platformFetch | N3 |
| `POST /auth-users/v1/users/{id}/password-reset` | platformFetch | N3 |
| `GET /observability/v1/usage` | platformFetch | N3 |
| `GET /api/v2/credit/bank/export/queue.xlsx` | chFetch (tenant) | N2 export when tenant filter set |

**404/501 / `data_source:"none"`** → DEMO badge + labeled example data (zero false greens).

---

## F0 GATE: ✅ PASS

Map complete. Proceed to F1 stacked PRs.
