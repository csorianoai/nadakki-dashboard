# 01 — Current Auth State (Backend Audit)

**Repo audited:** `C:\Users\cesar\Projects\nadakki-ai-suite\nadakki-ai-suite`
**Date:** 2026-05-10
**Scope:** Identify how authentication, tenancy, and authorization work *today* before designing dynamic RBAC.
**Method:** Static read of `main.py`, `routers/`, `middlewares/`, `services/sic_auth_service.py`, `admin_auth.py`, `migrations/versions/*.py`, `backend/db/rls.py`.

---

## TL;DR

The backend has **three overlapping, non-unified auth mechanisms**, none of which provide true user-level authentication on the main API surface:

1. **Header-trust pseudo-auth** (`X-Tenant-ID`, `X-Role`) — the dominant mechanism, used by ~all `main.py` endpoints. Headers are read with `Header(None)` and trusted without validation. Defaults to `"default"` or `"credicefi"` if missing.
2. **Hardcoded admin API keys** in `admin_auth.py` (in source code, not env vars).
3. **SIC JWT system** (`services/sic_auth_service.py` + `middlewares/sic_auth_middleware.py`) — real HMAC-SHA256 JWT, but the middleware is **not registered in `main.py`**, so it only protects SIC endpoints that explicitly call `validar_token`.

There is **no `users` table with `password_hash`**, **no role/permission tables**, and **no concept of "core subscription per tenant"** beyond the recent `tenant_modules` (10). Dynamic RBAC has to be built on top of the existing `tenants` + `users` + `tenant_modules` foundation, while bridging two inconsistent RLS conventions (`app.tenant_id` vs `app.current_tenant_id`).

---

## 1.1 Authentication mechanisms in use

### Mechanism A — Header-trust (dominant)

**Files:** `main.py` (lines 1672–2536+ pattern repeats hundreds of times), most routers.

**How it works:**

```python
x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID")
tid = (x_tenant_id or "default").strip() or "default"
```

- `X-Tenant-ID` is read directly from the request header.
- No signature, no validation, no enforcement that the caller has access to that tenant.
- `X-Role` is in CORS `allow_headers` (`main.py:268`) but is **not consumed in the audited code path**.
- Falls back to `"default"` tenant if missing.
- No `Authorization: Bearer` parsing on the main router surface.

**Implication:** Any HTTP client can claim any tenant by setting a header. The only protection is whatever sits in front of the API (Render/CORS/network). There is no user identity at all.

### Mechanism B — Hardcoded admin API keys

**File:** `admin_auth.py:15-18`

```python
ADMIN_KEYS = {
    "nadakki_admin_2025_master": {"role": "super_admin", "name": "Master Admin"},
    "nadakki_admin_credicefi_2025": {"role": "tenant_admin", "tenant_id": "credicefi", ...},
}
```

- Two API keys live in source code (committed). The file comment acknowledges this is dev scaffolding (`# en producción usar variables de entorno`).
- Used via `verify_admin_key` / `verify_super_admin` FastAPI dependencies.
- Plain-text comparison (`if x_admin_key not in ADMIN_KEYS`), no hashing of the lookup.
- Hits the `X-Admin-Key` header.
- Audit log is **in-memory only** (`ADMIN_AUDIT_LOG = []`, capped at 1000 entries) — lost on restart.

**Implication:** Anyone with read access to the repo has the production admin master key. This is the single biggest live security gap.

### Mechanism C — SIC JWT (HS256)

**Files:** `services/sic_auth_service.py`, `middlewares/sic_auth_middleware.py`, `routers/sic_auth_router.py`.

**How it works:**

- HMAC-SHA256 hand-rolled JWT (`generar_token`, `validar_token`).
- Secret: `os.environ.SIC_JWT_SECRET`. Falls back to `"nadakki-sic-dev-secret-2025"` if env not set (logs a warning). Hard-fails only if `RENDER=true` or `SIC_PRODUCTION=1`.
- Token payload: `{sub, tid, rol, permisos[], nombre, tipo, iat, exp}` — already has the *shape* RBAC needs.
- Access token: 1h expiry. Refresh token: 24h.
- Users live in `_USUARIOS_SIMULADOS` (an in-memory dict, 5 hardcoded demo users for `banco-demo`). In production mode this dict is empty and `obtener_perfil` always fails — meaning the JWT system **does not work in production today**.
- Roles defined inline as strings: `admin`, `supervisor`, `analista`, `auditor`, `comite`. Permissions are inline lists per user.

**Endpoints exposed:** `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` (from `routers/sic_auth_router.py`).

**Critical:** `SICAuthMiddleware` is **not registered** in `main.py`. Only `RLSMiddleware`, `AuditMiddleware`, `GlobalRateLimitMiddleware`, `UsageTrackingMiddleware`, `JSONErrorMiddleware` are mounted (`main.py:280-284`). So JWT is enforced *only* in SIC-specific endpoints that explicitly call `validar_token`, not platform-wide.

### Mechanism D — Per-tenant API keys (partial)

**File:** `backend/routers/api_keys_router.py`

- `POST /api/v1/tenants/{tenant_id}/api-keys` generates `nad_live_<40hex>` keys, stored as SHA-256 hash in an `api_keys` table.
- Schema is created elsewhere (not in `migrations/versions/` 001-011 explicitly — likely in `backend/db/setup.py`).
- The router mints keys but **the audit did not find a middleware/dependency that *verifies* incoming API keys against this table**. The keys appear to be issuable but not enforced.

---

## 1.2 Tables present today

Source: `migrations/versions/` 001-011 (Alembic head is `011`).

| Table | From | Columns relevant to RBAC | Notes |
|---|---|---|---|
| `tenants` | 001 | `id TEXT PK`, `name`, `created_at` | id is TEXT in 001, but later migrations (010) reference `tenants(id) UUID`. **Schema drift exists.** |
| `tenants` (extended) | 002 | + `slug UNIQUE`, `plan` (default `starter`) | |
| `users` | 002 | `id INT autoinc`, `tenant_id FK`, `email`, `role VARCHAR default 'viewer'`, `created_at` | **No `password_hash`. Single role per user. Single tenant per user (FK).** |
| `oauth_tokens` | 002 | tenant_id, platform, access_token, refresh_token | Ad-platform OAuth (Google/Meta), not user auth |
| `agent_executions`, `audit_events`, `tenant_config` | 002 | tenant-scoped operational tables | |
| `audit_logs` | 001 | UUID PK, RLS-enabled | |
| `module_catalog` | 010 | `slug PK`, `label`, `description`, `category` | 18 modules seeded (credit, legal, sic, marketing, …) |
| `tenant_modules` | 010 | `id UUID`, `tenant_id UUID FK`, `module_slug FK`, `enabled`, `config JSONB`, `expires_at` | **This is the closest existing analogue to `tenant_subscriptions`.** RLS-enabled. |
| `api_keys` | (not in versions/, likely `backend/db/setup.py`) | tenant_id, key_hash, prefix, name | Issued but not verified by any middleware found |
| `agent_runs`, `agent_run_events`, `webhook_dead_letters` | 004 | observability | |

**Tables absent (needed for RBAC):**
- `platform_cores` (catalog of cores) — *partially overlaps with `module_catalog`*
- `platform_role_templates`
- `platform_role_permissions`
- `tenant_subscriptions` — *partially overlaps with `tenant_modules`*
- `user_tenant_roles`
- `sessions` / `refresh_tokens` (JWT is stateless today, no revocation list)

---

## 1.3 Pydantic schemas (auth-relevant)

**`schemas/` directory contents** (only auth-relevant entries):
- *(none)* — no `auth.py`, `user.py`, `token.py`, or `tenant.py` in `schemas/`.

**Inline auth schemas found:**
- `routers/sic_auth_router.py`: `LoginRequest {email, password}`, `RefreshRequest {refresh_token}`. Response shape returned ad-hoc as a dict from `autenticar_usuario`.
- `backend/routers/api_keys_router.py`: `CreateKeyRequest {name}`.
- `admin_auth.py`: no Pydantic models; admin lookup is a dict comparison.

**Implication:** Auth payload shapes are scattered, untyped at the response boundary, and not OpenAPI-discoverable as a coherent contract.

---

## 1.4 Auth-related endpoints today

| Endpoint | Method | Auth required | Source |
|---|---|---|---|
| `/auth/login` | POST | none (issues JWT) | `routers/sic_auth_router.py` |
| `/auth/refresh` | POST | refresh token | `routers/sic_auth_router.py` |
| `/auth/me` | GET | `Authorization: Bearer` | `routers/sic_auth_router.py` |
| `/api/v1/auth/login` (path expected by `SICAuthMiddleware._PUBLIC_PATHS`) | POST | — | **Likely missing — middleware whitelists a prefix that isn't mounted by `sic_auth_router` (which uses `/auth`, not `/api/v1/auth`).** Inconsistency. |
| `/api/v1/tenants/{id}/api-keys` | POST/GET/DELETE | unknown (no dep visible) | `backend/routers/api_keys_router.py` |
| Google/Meta OAuth callbacks | — | OAuth state | `routers/auth/google_oauth.py`, `meta_oauth.py` |

**Missing endpoints vs. target RBAC spec:**
- `/auth/logout` ✗
- `/auth/switch-tenant` ✗ (token has single `tid`)
- `/auth/switch-role` ✗ (token has single `rol`)
- `/platform/cores` catalog ✗ (`module_catalog` exists but no public endpoint)
- `/platform/roles/{core}` ✗
- `/tenants/me/*` ✗
- `/admin/users` and role management ✗
- `/superadmin/*` ✗

---

## 1.5 GAPS vs dynamic RBAC target

Numbered for traceability into FASE 2 / FASE 4.

| # | Gap | Severity | Notes |
|---|---|---|---|
| G01 | **No platform-wide auth enforcement.** Most endpoints trust `X-Tenant-ID` header without verification. | CRITICAL | Any HTTP client can impersonate any tenant. |
| G02 | **Hardcoded admin API keys committed to repo** (`admin_auth.py`). | CRITICAL | Production secret in version control. Must rotate + move to RBAC superadmin role. |
| G03 | **No `password_hash` on `users` table.** | HIGH | Cannot persist real users; current JWT login uses in-memory `_USUARIOS_SIMULADOS`. |
| G04 | **`users.role` is a single VARCHAR with default `'viewer'`.** | HIGH | Cannot model multi-role, multi-core. Need `user_tenant_roles` junction. |
| G05 | **`users.tenant_id` is a FK (1:1).** | HIGH | A user can only belong to one tenant. Doesn't support consultants / cross-tenant superadmins. |
| G06 | **No `platform_cores` table.** Core list lives partly in `module_catalog` (10), partly in `routers/` mount logic, partly in code comments. | HIGH | Need single source of truth. `module_catalog` is the closest fit and may be repurposed/extended. |
| G07 | **No role templates / no permissions table.** Permissions exist only as hardcoded string lists inside `_USUARIOS_SIMULADOS`. | HIGH | No way to define a role granularly per (core, resource, action). |
| G08 | **No subscription model.** `tenant_modules` exists but is binary enabled/disabled — no plan tier, no monthly cost, no `expires_at` semantics enforced at request time. | MEDIUM | Need to either evolve `tenant_modules` or add `tenant_subscriptions` alongside. |
| G09 | **`SICAuthMiddleware` exists but is not registered.** JWT auth only fires inside SIC endpoints that call `validar_token` directly. | HIGH | Either register globally (with compatibility mode) or remove the dead code. |
| G10 | **JWT secret falls back to a known dev string** when `SIC_JWT_SECRET` env is unset and `RENDER`/`SIC_PRODUCTION` flags are missing. | HIGH | Tokens issued under the fallback secret are forgeable. |
| G11 | **No JWT revocation / refresh-token rotation / session store.** | MEDIUM | Stateless HS256 only. A leaked token is valid until `exp`. |
| G12 | **No `core` claim in the JWT.** Token has `rol` (single string) and `permisos` (flat list), but no notion of "this token is acting in the credit core right now." | HIGH | Required by spec (login response includes `tenant_id + roles[]`, switch-tenant, switch-role). |
| G13 | **Inconsistent RLS variable names**: migrations 001/003 use `app.tenant_id`; migrations 004/006/007/010 use `app.current_tenant_id`. `services/db.py` sets both. | MEDIUM | Confusing but functional. Should standardize during RBAC migration. |
| G14 | **Inconsistent `tenants.id` type**: declared as `TEXT` in 001, treated as `UUID` in 010's FK casts. | MEDIUM | New `user_tenant_roles.tenant_id UUID` will hit this. Need a tenants ID-type cleanup migration. |
| G15 | **API key issuance has no verification middleware.** Keys are minted via `/api/v1/tenants/{id}/api-keys` and stored hashed in `api_keys`, but nothing in the audited routes consumes them. | MEDIUM | Either build the verifier or remove the issuance endpoint. |
| G16 | **`module_catalog` and the proposed `platform_cores` overlap.** Both are core registries with `slug`, `label`, `description`, `category`. | MEDIUM | Decide: (a) extend `module_catalog` to become `platform_cores`, or (b) add `platform_cores` as a parallel concept and migrate. Recommend (a) for FASE 2. |
| G17 | **`tenant_modules` and proposed `tenant_subscriptions` overlap.** Both are tenant↔core junctions; `tenant_modules` has `enabled`, `config JSONB`, `expires_at`. Subscriptions add `plan_tier`, `monthly_cost_usd`, `status`. | MEDIUM | Same decision as G16. Recommend additive evolution. |
| G18 | **Mixed integer/UUID PKs**: `users.id` is `INTEGER autoincrement`; proposed `user_tenant_roles.user_id` is `UUID`. | MEDIUM | Either migrate `users.id` to UUID (riskier, breaks FKs) or accept INT and adjust the schema. |
| G19 | **No granular permission model.** Permissions today are flat lists per simulated user. Proposed `(resource, action, scope)` triplet is a step change. | LOW (design only) | Need defaults per role at seed time. |
| G20 | **No password reset / email verification flow.** Out of scope for this audit but worth flagging for Sprint 2. | LOW | Backlog item. |

---

## 1.6 Risks (backward compat / migration / performance)

### Backward compatibility risks
- **R1** — Hundreds of `Header(None, alias="X-Tenant-ID")` call sites in `main.py` will keep working *if* the new JWT-derived `tenant_id` is propagated into the same header (e.g., by the new middleware overwriting/setting `X-Tenant-ID` from the JWT claim before the route handler runs). Otherwise a one-shot rewrite touching ~200 endpoints.
- **R2** — `admin_auth.py` is imported into multiple routers via `Depends(verify_admin_key)`. The two hardcoded keys must continue to work during the coexistence window OR be migrated to a real superadmin user behind a feature flag.
- **R3** — SIC routers already gate on `validar_token`. The new JWT format must be a superset of the SIC JWT payload (`sub`, `tid`, `rol`, `permisos`) or include a compatibility shim.
- **R4** — `_USUARIOS_SIMULADOS` is used by SIC tests and demos. A migration that drops it without replacement breaks the demo path.

### Migration risks
- **R5** — `tenants.id` type drift (TEXT vs UUID, G14) means a one-step migration adding `user_tenant_roles.tenant_id UUID FK` will fail until tenants is converted to UUID *or* the new table uses TEXT/VARCHAR.
- **R6** — `users.id` int vs proposed UUID FK in `user_tenant_roles`. Need a deterministic migration: either generate UUIDs for existing user rows and add a `legacy_int_id` column, or keep `user_id` as INT in the new table.
- **R7** — `module_catalog` already has 18 modules seeded with `slug` strings (`credit`, `legal`, etc.). `platform_cores` proposal uses `core_name VARCHAR(50) PK` — names must match exactly (`credit`, not `Credit Core`) or seed data will fork.
- **R8** — Existing `tenant_modules` rows for `credicefi` and `Banco Piloto RD` (UUID `550e8400-…0099`) need to either be reused as subscriptions or backfilled into the new `tenant_subscriptions` with sensible default `plan_tier`.

### Performance risks
- **P1** — Every authenticated request will now JOIN `user_tenant_roles → platform_role_permissions` to resolve permissions. Mitigate via:
  - Indexes already listed in the FASE 2 spec.
  - JWT payload should embed resolved permissions at login time (acceptable for short-lived access tokens; refresh forces re-resolution).
  - In-process cache keyed by `(user_id, tenant_id, core_name)` with TTL aligned to token expiry.
- **P2** — RLS session variables (`SET LOCAL`) fire on every request. Two variables today (`app.tenant_id` + `app.current_tenant_id`); adding `app.user_id` and `app.role` for downstream policies adds 2 more round trips per request. Could be coalesced into one `SET` call.

---

## 1.7 What can be reused (assets, not gaps)

- **Alembic is wired and at head `011`.** Adding migration `012_rbac_dynamic` is a natural next step (file naming follows `NNN_*.py` convention, not `YYYYMMDD_*.py` — adjust FASE 2 deliverable accordingly).
- **HS256 JWT generation/validation already implemented** in `services/sic_auth_service.py`. Can be lifted to `services/auth_service.py` with payload extended (add `core`, `roles[]` array).
- **RLS infrastructure** is mature: `current_tenant_id()` SQL function, per-table policies, RLSMiddleware. New tables can adopt it directly.
- **`module_catalog` + `tenant_modules`** are conceptually compatible with `platform_cores` + `tenant_subscriptions`. Recommend evolving in place rather than parallel tables.
- **Audit infrastructure** (`audit_logs`, `audit_events`, `AuditMiddleware`) is already capturing per-request tenant/user/action — ideal home for RBAC decision logs.

---

## 1.8 Recommended FASE 2 adjustments

Based on the gaps above, the schema proposal in `rbac-audit-prompt.txt` should be adjusted as follows (to be detailed in `02_RBAC_SCHEMA_PROPOSAL.md`):

1. **Evolve `module_catalog` → `platform_cores`** instead of creating a parallel table (G06, G16). Add `enabled`, `version`, `icon` columns.
2. **Evolve `tenant_modules` → `tenant_subscriptions`** by adding `plan_tier`, `monthly_cost_usd`, `status` columns (G08, G17). Keep `config JSONB` for backwards compatibility.
3. **Resolve `tenants.id` type drift first** (G14). Either drop and recreate as UUID, or accept TEXT and have `user_tenant_roles.tenant_id` be TEXT/VARCHAR.
4. **Keep `users.id` as INT** (G18) for backward compatibility, and have `user_tenant_roles.user_id` be `INTEGER REFERENCES users(id)`. Saves a destructive migration.
5. **Migration file should be `012_rbac_dynamic.py`** (not `YYYYMMDD_rbac_dynamic.py`) — matches existing convention.
6. **Add `password_hash`, `is_active`, `mfa_enabled`, `last_login_at` to `users`** in the same migration (G03). Without this, the RBAC schema is half-built.

---

## 1.9 Pending / unverified

- **`api_keys` table location**: referenced by `backend/routers/api_keys_router.py` but not in `migrations/versions/*`. Likely defined in `backend/db/setup.py` (raw SQL bootstrap, not Alembic-tracked). Worth confirming during FASE 2 implementation.
- **Total endpoint count in `main.py`**: not exhaustively counted; pattern repetition suggests 100+ routes mounting `X-Tenant-ID` directly. A grep-based inventory should accompany FASE 4 backwards-compat plan.
- **Frontend coupling**: not audited (out of scope per prompt). The dashboard repo's `TenantContext.tsx` reads `X-Tenant-ID`-based responses today and will need a corresponding refactor when JWT replaces it.

---

## Gap count: **20** (G01–G20)
## Critical: **2** (G01, G02)
## High: **8** (G03, G04, G05, G06, G07, G09, G10, G12)
## Medium: **8** (G08, G11, G13, G14, G15, G16, G17, G18)
## Low: **2** (G19, G20)
