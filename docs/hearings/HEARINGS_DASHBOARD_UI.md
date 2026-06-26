# Hearings (Audiencias) Dashboard — Frontend

Real-time hearings calendar + KPIs UI for the legal module of the Nadakki dashboard.

## Route

- `app/(forge)/legal/hearings/page.tsx` → `/legal/hearings`
- Lives under the existing `(forge)` route group next to `cases`, `contracts`, etc.
  (NOT under `app/legal/` and NOT under `/admin/`).
- Nav entry: a single "Audiencias" link added to `components/legal/LegalSubNav.tsx`.

## Endpoints consumed (via the legal proxy)

The frontend calls the same-origin Next.js rewrite proxy `/api/legal/*`, which
`next.config.js` rewrites to `${backendUrl}/api/v1/legal/*`. No backend URL is
hardcoded.

| UI action | Frontend call | Backend (real) |
|---|---|---|
| Load enums/timezone | `GET /api/legal/hearings/config` | `GET /api/v1/legal/hearings/config` |
| Load KPIs | `GET /api/legal/hearings/kpis` | `GET /api/v1/legal/hearings/kpis` |
| List | `GET /api/legal/hearings?from&to&case_id&status&hearing_type&limit&offset` | `GET /api/v1/legal/hearings` |
| Detail (lib only) | `GET /api/legal/hearings/{hearing_id}` | `GET /api/v1/legal/hearings/{hearing_id}` |
| Create | `POST /api/legal/hearings` | `POST /api/v1/legal/hearings` |
| Change status | `PATCH /api/legal/hearings/{hearing_id}/status` | `PATCH /api/v1/legal/hearings/{hearing_id}/status` |

Path param is `{hearing_id}` (not `{id}`).

## Shape corrections vs the live OpenAPI (contract is the source of truth)

Verified against `https://nadakki-ai-suite.onrender.com/openapi.json`:

| Item | Earlier assumption | Real contract (used here) |
|---|---|---|
| List response | `{ items, total, limit, offset }` | `{ hearings: HearingOut[], total: number }` |
| Config keys | `allowed_statuses[]`, `allowed_hearing_types[]` | `statuses[]`, `hearing_types[]`, `default_timezone`, `transitions{}` |
| KPIs | total / compliance rate | `upcoming_7d`, `overdue`, `completed_30d`, `cancelled_30d`, `by_status{}`, `by_type{}`, `next_hearing`, `demo_data` (NO total, NO compliance rate) |
| `/kpis` params | `range` | none (takes no query params) |
| List filters | unspecified | `from`, `to`, `case_id`, `status`, `hearing_type`, `limit`, `offset` |
| PATCH status body | `{ status }` | `{ status, reason? }` |
| Create required | `title`, `hearing_type` | only `title` + `hearing_date` (rest server-defaulted) |
| Fields | `scheduled_at`, `court_name` | `hearing_date`, `courtroom` (real `HearingOut` fields only) |

Enums (`statuses`, `hearing_types`) and `default_timezone` are read from `/config`
at runtime — never hardcoded.

## Auth / proxy behavior

The client (`lib/legal/hearings/hearings-api.ts`) reuses the existing legal
convention: relative `/api/legal/*` calls with an `X-Tenant-ID` header taken from
`useLegalEffectiveTenantId()`. `tenant_id` is never sent in any request body and is
never accepted/exposed in forms.

### Security note (inherited, not introduced)

> The frontend uses the legal proxy with `X-Tenant-ID`, which is the current
> convention of the dashboard's legal module. Real tenant isolation for hearings
> depends on the PENDING platform cutover: today the backend app runs with RLS
> bypass, so `X-Tenant-ID` is de-facto the runtime tenant mechanism. This UI does
> NOT introduce that risk; it inherits it from the existing legal pattern. We do
> NOT claim the backend is already the isolation authority — that authority
> (RLS + JWT-tenant) activates with the cutover.

## UI states

- **Loading:** `LegalLoadingSkeleton`.
- **Empty:** "No hay audiencias para este rango" + CTA (create, if allowed).
- **Error:** `LegalErrorState` with retry.
- **403:** dedicated permission panel ("Sin permiso").
- **409 / 422:** the backend's own message is surfaced verbatim (toast). Status
  transitions are validated by the backend, not assumed in the front.
- **401 / 500 / network:** mapped to clear messages; never a stack trace.

## RBAC (cosmetic gating)

The authority is the backend `403`. Write controls (create / change status) are
shown/hidden cosmetically via `canManageHearings(allRoles)` using real `role_key`s
(`legal_admin`, `tenant_admin`, `platform_superadmin`, plus `admin`/`attorney`/`paralegal`
defensively). If no clearly-authorizing role is detected the buttons are hidden, but
unknown/empty role data is treated as authorized (we never hide on pure uncertainty —
a button that returns 403 is better than one hidden by a wrong guess).

## How to create a hearing

Click "Nueva audiencia" → fill the form (only Title + Date/time are required) →
submit. On success the dialog closes, resets, the list + KPIs refetch, and a success
toast appears. A duplicate `external_ref` returns 409 and is surfaced without
duplicating the hearing.

## KPIs

KPI cards render the real fields: `upcoming_7d`, `overdue`, `completed_30d`,
`cancelled_30d`, plus the next hearing. If the backend returns `demo_data: true`,
an honest "Datos de demostración" banner is shown (never hidden).

## `/config` usage

Filter and create-dialog option lists are populated from `/config` (`statuses`,
`hearing_types`) and `default_timezone` is used as the create default timezone.

## Manual smoke

Pending real run against the deployed backend with a logged-in attorney/admin user.
CORS gotcha: if testing on localhost against Render returns CORS errors, that is the
backend allowlist (not this code) — test against the Vercel preview; do NOT disable
CORS or touch the backend.

## Risks / notes

- `hearing_date`: the native `datetime-local` value is interpreted in the browser
  timezone and converted to ISO via `toISOString()`; the `timezone` field is sent
  separately (default from `/config`). Cross-timezone authoring is approximate.
- Tenant isolation depends on the platform cutover (see security note).
- The calendar view is a dependency-free day-group view (no calendar library).
