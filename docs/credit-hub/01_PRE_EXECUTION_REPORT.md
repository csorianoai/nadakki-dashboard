# Credit Hub Frontend — Step 0 Pre-Execution Report

Generated: 2026-04-25

Scope: Step 0 only. No frontend foundation files, hooks, tests, routes, or UI were created.

## Target Environment

| Item | Observed |
|------|----------|
| Editor / agent | Cursor with auto-run |
| Frontend repo | `C:\Users\ramon\Projects\nadakki-dashboard` |
| Backend repo | `C:\Users\ramon\Projects\nadakki-ai-suite` |
| Frontend branch | Created and switched to `feat/credit-hub-frontend-fase-1` |
| Package manager | npm (`package-lock.json` present) |
| Node / npm | Node `v25.5.0`, npm `11.8.0` |
| Frontend framework | Next.js (`next dev`, app router) |
| Dashboard dev command | `npm run dev` |

## 0.1 Backend Bridge Inspection

### `routers/sic_credit_applications_bridge_router.py`

Mounted router prefix: `/credit-applications` under main RouteOne prefix `/api/v1/sic`.

Registered routes:

| Method | Route | Response model | Dependency |
|--------|-------|----------------|------------|
| `POST` | `/api/v1/sic/credit-applications` | `CreditApplicationRestOut` | `routeone_context`, `require_credit_hub_applications_rest_sync` |
| `GET` | `/api/v1/sic/credit-applications` | `List[CreditApplicationRestOut]` | `routeone_context`, `require_credit_hub_applications_rest_sync` |
| `GET` | `/api/v1/sic/credit-applications/{application_id}` | `CreditApplicationRestOut` | `routeone_context`, `require_credit_hub_applications_rest_sync` |

### `models/sic_credit_application_rest.py`

`CreditApplicationCreate` fields:

| Field | Type / validation | Required |
|-------|-------------------|----------|
| `application_id` | optional UUID string, generated if omitted | No |
| `applicant_name` | string, `min_length=1`, `max_length=300` | Yes |
| `applicant_email` | optional string, `max_length=320` | No |
| `applicant_phone` | optional string, `max_length=40` | No |
| `dealer_id` | optional string, `max_length=120` | No |
| `vehicle_vin` | optional string, `max_length=32` | No |
| `vehicle_year` | optional int, `1900..2100` | No |
| `vehicle_make` | optional string, `max_length=80` | No |
| `vehicle_model` | optional string, `max_length=80` | No |
| `requested_amount` | optional `Decimal`, `ge=0`, max 14 digits / 2 decimals | No |
| `down_payment` | optional `Decimal`, `ge=0`, max 14 digits / 2 decimals | No |
| `status` | `"draft" | "submitted"`, default `"draft"` | No |

`CreditApplicationRestOut` fields:

`application_id`, `tenant_id`, `applicant_name`, `applicant_email`, `applicant_phone`, `dealer_id`, `vehicle_vin`, `vehicle_year`, `vehicle_make`, `vehicle_model`, `requested_amount`, `down_payment`, `status`, `created_at`, `updated_at`.

Important frontend calibration:

- Pydantic serializes `requested_amount` and `down_payment` decimals as strings in the live response.
- Optional fields are represented as explicit `null` in the live response.
- `status` is typed as `str` in response, while create accepts only `draft | submitted`.

### `services/sic/credit_applications_rest_service.py`

Confirmed behavior:

| Behavior | Observed |
|----------|----------|
| `application_id` | Generated with `uuid4()` when omitted; explicit ids are parsed as UUID or return 422. |
| Tenant scope | Uses `get_application_repository()` + `application_registry.assert_application_tenant`. |
| Cross-tenant detail | `GET .../{id}` returns 403 `{"error":"tenant_forbidden"}`. |
| Missing detail | Returns 404 `{"error":"application_not_found"}`. |
| Duplicate application id | Returns 409 `application_id_conflict`. |
| Event append | Appends `ApplicationEventType.application_created` with payload `{"source":"credit_hub_rest"}`. |
| Storage | Uses PR-C repository factory, so memory by default and PG if `ROUTEONE_STORAGE_MODE=pg` is configured. |
| `X-Actor-Role` | Parsed and validated by `routeone_context`; passed into event append. No additional RBAC is enforced for create/list/detail. |
| `Idempotency-Key` | **Not consumed** by this service/router. Duplicate POST without caller-provided `application_id` creates a new id each time. |

Backend divergence to keep visible: Fase 1 client should still send `Idempotency-Key` on POST for the global frontend contract, but backend bridge does not currently replay/dedupe create application requests.

### `services/sic/routeone_common.py`

503 / feature-off shapes:

| Gate | Env var | Default | 503 detail |
|------|---------|---------|------------|
| RouteOne parity | `ROUTEONE_PARITY_ENABLED` | `false` | `{"error":"routeone_parity_disabled","message":"Set ROUTEONE_PARITY_ENABLED=true to enable RouteOne parity APIs."}` |
| Applications REST kill-switch | `CREDIT_HUB_APPLICATIONS_REST_ENABLED` | `true` | `{"error":"routeone_parity_disabled","message":"Credit Hub applications REST is disabled (CREDIT_HUB_APPLICATIONS_REST_ENABLED)."}` |

Actor roles accepted by backend: `dealer`, `bank`, `customer`, `admin`. Missing `X-Actor-Role` defaults to `dealer`.

## 0.2 Existing Frontend Credit Hub Lib

Target frontend repo `C:\Users\ramon\Projects\nadakki-dashboard` currently has **no** `lib/credit-hub` directory.

Checked expected files in target repo:

| File | Status |
|------|--------|
| `lib/credit-hub/api/applications.ts` | Missing |
| `lib/credit-hub/types/applicationsRest.ts` | Missing |
| `lib/credit-hub/types/_generated.ts` | Missing |
| `lib/credit-hub/utils/featureDisabled.ts` | Missing |
| `lib/credit-hub/index.ts` | Missing |

Note: a prototype `lib/credit-hub` exists in the backend repo from prior work, but it is not in the dashboard target repo. Fase 1 should create a clean dashboard-owned foundation under `nadakki-dashboard/lib/credit-hub`.

## 0.3 Dashboard Host Inspection

### Existing Routes

The dashboard uses the Next app router and already has many routes. Relevant protected routes confirmed:

| Route family | Confirmed examples |
|--------------|--------------------|
| `/credit/*` | `app/credit/page.tsx`, `app/credit/new/page.tsx`, `app/credit/[id]/page.tsx`, `app/credit/dealer/page.tsx`, `app/credit/dealer/new/page.tsx`, `app/credit/dealer/[applicationId]/page.tsx`, `app/credit/bank/page.tsx`, `app/credit/bank/[applicationId]/page.tsx`, `app/credit/status/[applicationId]/page.tsx` |
| `/sic/*` | `app/sic/bandeja/page.tsx`, `app/sic/expedientes/page.tsx`, `app/sic/reportes/page.tsx`, `app/sic/auditoria/page.tsx`, `app/sic/configuracion/page.tsx`, `app/sic/upload/page.tsx` |
| `/marketing/*` | `app/marketing/page.tsx`, `app/marketing/campaigns/page.tsx`, `app/marketing/campaigns/new/page.tsx`, `app/marketing/journeys/page.tsx`, `app/marketing/analytics/page.tsx`, `app/marketing/whatsapp/page.tsx` |
| `/admin/*` | `app/admin/page.tsx`, `app/admin/audit/page.tsx`, `app/admin/readiness/page.tsx`, `app/admin/system/page.tsx`, `app/admin/billing/page.tsx` |

No `/credit-hub/*` routes exist yet. Do not create them in Fase 1.

### Auth + Tenant Pattern

Root layout wraps the app with:

- `AuthProvider` from `contexts/AuthContext`
- `TenantProvider` from `contexts/TenantContext`
- `ToastProvider`
- `AppGate`

Tenant source:

- `contexts/TenantContext.tsx` exports `useTenant()`.
- `tenantId` is loaded from `localStorage["nadakki_tenant_id"]`.
- If authenticated and `AuthContext.tenantId` exists, `TenantProvider` adopts it.
- `setTenantId(id)` writes back to local storage.
- Existing tenant selector components use `useTenant()`.

Auth source:

- `contexts/AuthContext.tsx` exports `useAuth()`.
- Auth is local-storage backed (`nadakki_auth`, `nadakki_tenant_id`, etc.).
- Demo users include tenant ids `sf-rentals-nadaki-excursions` and `credicefi`.
- SIC auth token may be stored as `nadakki_sic_token`, but existing generic fetch clients mostly use tenant headers rather than a bearer token.

Existing API style:

- `lib/api/client.ts` provides `fetchWithFallback` for dashboards, not appropriate for Credit Hub mutations because it never throws and returns fallback data.
- `lib/api/base.ts` has `fetchAPI`, same-origin `API_BASE = ""`, accepts tenant/admin/role headers.
- `lib/api/spyfu-client.ts` uses `NEXT_PUBLIC_API_URL || https://nadakki-ai-suite.onrender.com`, tenant resolution, and custom typed errors.
- `lib/credit-api.ts` is legacy `/api/v2/credit/*`, with `NEXT_PUBLIC_API_URL || http://localhost:8000`.

Recommended Fase 1 decision: create a dedicated `lib/credit-hub/api/client.ts`; reuse `useTenant()` from `contexts/TenantContext`; keep backend base configurable with `NEXT_PUBLIC_CH_API_BASE`, defaulting to `http://127.0.0.1:8001` for dev if needed.

### UI Components Available

`components/ui/*` contains:

`TenantSelector`, `TenantSwitcher`, `SystemStatus`, `SearchModal`, `HelpCenter`, `NavigationBar`, `DataSourceBadge`, `AgentCard`, `Toast`, `ThemeSwitcher`, `StatusBadge`, `StatCard`, `Skeleton`, `SafeRender`, `Breadcrumbs`, `LoadingSpinner`, `GlassCard`, `CoreCard`, and `index.ts`.

There is no shadcn-style button/card/input set in `components/ui/*`; it is a custom UI folder. No UI should be created in Fase 1.

### React Query / SWR

`package.json` has **no** `@tanstack/react-query`, `swr`, `useQuery`, or `QueryClientProvider` usage. Fase 1 requires React Query hooks, so add `@tanstack/react-query` during Fase 1 and introduce a provider only if needed for compilation/tests. Do not create portal UI.

### Test Setup

Jest config:

- `testEnvironment: "jsdom"`
- `testMatch: ["**/tests/**/*.test.[jt]s?(x)"]`
- path alias `@/*`
- `ts-jest` transform

Fase 1 tests should live under `tests/credit-hub/...`.

## Step 0 Findings / Blockers

| Severity | Finding | Impact |
|----------|---------|--------|
| Medium | Backend applications bridge does **not** consume `Idempotency-Key`. | Frontend can send idempotency keys, but duplicate network submits may still create multiple applications unless backend later adds idempotency replay. Not blocking Foundation; note for Dealer form UX. |
| Low | Backend validates `X-Actor-Role` enum but does not enforce RBAC on applications list/create/detail. | Frontend permission matrix remains UI-level for Fase 1. Backend authorization may need tightening before production. |
| Medium | Dashboard has no React Query dependency/provider. | Fase 1 must add `@tanstack/react-query` and provide test wrappers for hooks. |
| None | `/credit`, `/sic`, `/marketing`, `/admin` routes already exist. | Fase 1 must avoid touching these route trees. |
| None | `lib/credit-hub` does not exist in target frontend repo. | Fase 1 will create it fresh; no migration conflict inside dashboard. |

## Checkpoint 1 Decision

Step 0 is complete. Recommended next action after human OK:

1. Add `@tanstack/react-query`.
2. Create `lib/credit-hub` foundation in the dashboard repo only.
3. Calibrate `_generated.ts` exactly to live shapes: `routeone_parity_enabled`, string decimal amounts, 200 create response, ISO timestamps.
4. Implement dedicated `chFetch`, API modules, hooks, permissions, and tests.
5. Do **not** create `/credit-hub` routes or portal UI in Fase 1.
