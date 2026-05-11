# 03 — RBAC API Proposal

**Spec source:** `rbac-audit-prompt.txt` FASE 3.
**Schema source:** `02_RBAC_SCHEMA_PROPOSAL.md`.

This document specifies:
- 22 new endpoints under `/api/v2/*` namespace
- 6 new FastAPI dependency functions (middleware-as-Depends)
- JWT v2 payload shape
- Compatibility plan with existing `X-Tenant-ID` header surface

The `/api/v2/` prefix isolates the new endpoints; the legacy header-trust surface continues to live under `/api/v1/`, `/`, and direct router mounts until Sprint 2 migrates it.

---

## 3.1 JWT v2 payload

Defined in `models/rbac.py` (`TokenPayloadV2`). Cleartext claim names abbreviated to keep token size small.

```json
{
  "sub":  142,                          // user_id (integer)
  "tid":  "credicefi",                  // tenant_id (TEXT, matches tenants.id)
  "core": "credit",                     // active core context; nullable
  "roles": ["dealer", "tenant_admin"],  // role_keys active for (tid, core)
  "perms": [                            // resolved at login, cached in token
    "credit.application:create",
    "credit.application:read",
    "tenant.user:read"
  ],
  "typ":  "access",                     // "access" | "refresh"
  "iat":  1715347200,
  "exp":  1715350800                    // access: 1h, refresh: 24h
}
```

- `perms` are embedded in the access token to avoid a DB round-trip on every request. They are re-resolved at refresh time.
- Signing: HS256 (same as SIC), but secret is rotated under env `NADAKKI_JWT_SECRET` (separate from `SIC_JWT_SECRET` during coexistence).
- A `kid` (key id) header field is reserved for future rotation; not used in Sprint 1.

---

## 3.2 Middleware / dependency catalog

All implemented as FastAPI `Depends`. They are *not* `BaseHTTPMiddleware` so they can short-circuit specific routes without affecting the global middleware stack.

| Name | Signature | What it does | Raises |
|---|---|---|---|
| `require_auth` | `(token: str = Depends(oauth2_scheme)) -> TokenPayloadV2` | Validates JWT signature, expiry, and `typ='access'`. Returns the decoded payload. | 401 if missing / invalid / expired |
| `require_core(core_name: str)` | factory; `(payload: TokenPayloadV2 = Depends(require_auth)) -> TokenPayloadV2` | Checks the tenant has an `active` `tenant_subscriptions` row for `core_name`. | 403 if no active sub |
| `require_role(core_name: str, role_key: str)` | factory; same shape | Checks `role_key` appears in `payload.roles` for the active core. Treats `platform_superadmin` as a universal pass. | 403 if role missing |
| `require_permission(resource: str, action: str)` | factory; same shape | Checks `f"{resource}:{action}"` ∈ `payload.perms`, with `*` wildcard expansion. | 403 if denied |
| `require_tenant_admin` | `(payload: TokenPayloadV2 = Depends(require_auth)) -> TokenPayloadV2` | Shorthand for `require_role("platform", "tenant_admin")`. | 403 |
| `require_platform_admin` | same shape | Shorthand for `require_role("platform", "platform_superadmin")`. | 403 |

Wildcard rules for `require_permission`:
- `"credit.*:*"` granted → any `credit.<x>:<y>` check passes.
- `"*:*"` granted → any check passes (used by `platform_superadmin`).
- Wildcard expansion is at check time, not stored expanded in `perms`.

All dependencies set request state `request.state.user_id`, `request.state.tenant_id`, `request.state.core` so downstream code and audit logging can read them without redecoding the JWT.

---

## 3.3 Endpoints — AUTH

### POST `/api/v2/auth/login`
- **Auth:** public
- **Request:** `LoginRequestV2 { email: str, password: str, tenant_id?: str }`
- **Response 200:** `LoginResponseV2`
- **Description:** Authenticates user, picks `active_core` = first core the user has any role in (alphabetical, deterministic), returns access + refresh tokens with embedded permissions.
- **Errors:** 401 (bad credentials), 403 (user `is_active=FALSE`), 404 (tenant hint references unknown tenant).

### POST `/api/v2/auth/refresh`
- **Auth:** refresh token in body
- **Request:** `{ refresh_token: str }`
- **Response 200:** new access token + refreshed permission list.
- **Description:** Re-resolves `perms` against the DB so role grants/revocations propagate within one refresh cycle.
- **Errors:** 401 (invalid / expired / wrong `typ`).

### POST `/api/v2/auth/logout`
- **Auth:** `require_auth`
- **Request:** empty body
- **Response 204**
- **Description:** Adds the token's `jti` (added to payload in this version) to a `revoked_tokens` table with `expires_at = exp`. Future requests with that JWT are rejected by `require_auth` after a small in-memory cache check.
- **Errors:** 401 if no token.

### GET `/api/v2/auth/me`
- **Auth:** `require_auth`
- **Response 200:** `{ user_id, email, tenant_id, active_core, roles, perms, available_tenants, available_cores }`
- **Errors:** 401.

### POST `/api/v2/auth/switch-tenant`
- **Auth:** `require_auth`
- **Request:** `SwitchTenantRequest { tenant_id: str }`
- **Response 200:** new access + refresh tokens scoped to the new tenant; previous tokens are NOT auto-revoked (client should discard).
- **Description:** Validates the user has at least one active grant in the new tenant. Re-resolves `perms`. `active_core` is recomputed.
- **Errors:** 403 (no grants in target tenant), 404 (unknown tenant), 401.

### POST `/api/v2/auth/switch-role`
- **Auth:** `require_auth`
- **Request:** `SwitchRoleRequest { core_name: str, role_key: str }`
- **Response 200:** new access token with `core` set and `roles` filtered to roles the user holds in (current `tid`, target `core_name`). Refresh token unchanged.
- **Description:** Lets a multi-role user narrow their active context (e.g., a credit_admin who also has dealer rights signs in as dealer for compliance reasons).
- **Errors:** 403 (role not held), 404 (unknown core), 401.

---

## 3.4 Endpoints — PLATFORM CATALOG (read-only)

These are unauthenticated read endpoints for client bootstrapping (login screen shows core logos before auth).

### GET `/api/v2/platform/cores`
- **Auth:** public
- **Query:** `?enabled=true` (default), `?category=core`
- **Response 200:** `{ cores: CoreOut[] }`
- **Description:** Lists platform cores. Cached for 5min server-side.

### GET `/api/v2/platform/cores/{core_name}`
- **Auth:** public
- **Response 200:** `CoreOut`
- **Errors:** 404.

### GET `/api/v2/platform/roles/{core_name}`
- **Auth:** `require_auth`  (not public — leaks role taxonomy otherwise)
- **Response 200:** `{ roles: RoleTemplateOut[] }`
- **Description:** Returns system role templates for the core, plus tenant-specific roles belonging to the caller's tenant.

### GET `/api/v2/platform/roles/{core_name}/{role_key}/permissions`
- **Auth:** `require_auth` AND `require_role("platform", "tenant_admin")` (or `platform_superadmin`)
- **Response 200:** `{ permissions: PermissionOut[] }`
- **Errors:** 403, 404.

---

## 3.5 Endpoints — TENANT MANAGEMENT (caller's own tenant)

### GET `/api/v2/tenants/me/subscriptions`
- **Auth:** `require_auth`
- **Response 200:** `{ subscriptions: TenantSubscriptionOut[] }`
- **Description:** Subscriptions for `payload.tid`. All callers in a tenant can see what their tenant subscribes to.

### GET `/api/v2/tenants/me/users`
- **Auth:** `require_auth` AND `require_tenant_admin`
- **Query:** `?core_name=credit`, `?role_key=dealer`, `?active=true`, `?limit=50&offset=0`
- **Response 200:** `{ users: [...], total: int }`
- **Description:** Lists users in the caller's tenant with optional filters by role/core.

### GET `/api/v2/tenants/me/roles-overview`
- **Auth:** `require_auth` AND `require_tenant_admin`
- **Response 200:** `{ overview: [{ core_name, role_key, user_count, last_grant_at }] }`
- **Description:** Dashboard-style aggregated view of role distribution within the tenant.

---

## 3.6 Endpoints — ADMIN (tenant_admin)

All require `require_tenant_admin`.

### POST `/api/v2/admin/users`
- **Request:** `CreateUserRequest { email, password, tenant_id, grants[] }`
- **Response 201:** `{ user_id, email, tenant_id, grants_created: int }`
- **Errors:** 400 (email exists), 403 (cross-tenant attempt), 422 (weak password).
- **Description:** Creates user in caller's tenant. `tenant_id` in body MUST match `payload.tid` unless caller is `platform_superadmin`.

### POST `/api/v2/admin/users/{id}/roles`
- **Request:** `GrantRoleRequest`
- **Response 201:** `UserRoleOut`
- **Errors:** 404 (user / role template), 409 (duplicate grant), 403 (target user is in another tenant).
- **Description:** Grants a role to an existing user. Records `granted_by = payload.sub`.

### DELETE `/api/v2/admin/users/{id}/roles/{role_id}`
- **Response 204**
- **Description:** Soft delete — sets `active=FALSE`, preserves audit history.
- **Errors:** 404, 403.

### PATCH `/api/v2/admin/users/{id}`
- **Request:** `UpdateUserRequest { email?, is_active?, mfa_enabled? }`
- **Response 200:** updated user
- **Errors:** 404, 403, 422.

---

## 3.7 Endpoints — SUPERADMIN

All require `require_platform_admin`.

### POST `/api/v2/superadmin/cores`
- **Request:** `{ core_name, display_name, icon?, version?, description?, category? }`
- **Response 201:** `CoreOut`
- **Errors:** 409 (core_name exists).
- **Description:** Registers a new core. Used when onboarding a new vertical (accounting, healthcare, etc.).

### POST `/api/v2/superadmin/role-templates`
- **Request:** `{ core_name, role_key, display_name, description?, is_tenant_specific?, tenant_id?, permissions?: [{resource, action, scope}] }`
- **Response 201:** `RoleTemplateWithPermissionsOut`
- **Errors:** 404 (core_name), 409 (role_key duplicate), 422 (tenant_specific without tenant_id).

### POST `/api/v2/superadmin/tenants/{id}/subscriptions`
- **Request:** `{ core_name, plan_tier, expires_at?, monthly_cost_usd? }`
- **Response 201:** `TenantSubscriptionOut`
- **Errors:** 404 (tenant or core), 409 (existing active sub for same core — must PATCH instead).
- **Description:** Creates / updates a tenant's subscription to a core.

---

## 3.8 OpenAPI tags

All v2 endpoints carry consistent tags for SDK code-gen and grouping:

- `auth-v2`
- `platform-v2`
- `tenants-v2`
- `admin-v2`
- `superadmin-v2`

The legacy `/auth` (SIC) and `/api/v1/auth/*` (Google/Meta OAuth callbacks) tags are untouched.

---

## 3.9 Compatibility plan with legacy `X-Tenant-ID` surface

The existing main.py routers read `X-Tenant-ID` directly (~200 call sites). The new v2 middleware does not break them, because:

1. **Coexistence layer:** when `require_auth` succeeds, a small "tenant header shim" sets `request.state.tenant_id = payload.tid` AND injects `X-Tenant-ID: payload.tid` into the request headers (`request.scope["headers"]`) so legacy handlers downstream see the correct tenant value.
2. **`X-Role` header:** legacy code does not consume it; safe to ignore.
3. **Legacy clients** (those still sending only `X-Tenant-ID` without a JWT) keep hitting `/api/v1/*` and `/`. The new shim does not run for those paths.
4. **Feature flag:** `NADAKKI_RBAC_V2_ENABLED=true` gates the v2 router mount in `main.py`. Off by default until Sprint 1 is signed off.

---

## 3.10 Endpoint count summary

| Group | Count |
|---|---|
| Auth (`/api/v2/auth/*`) | 6 |
| Platform catalog (`/api/v2/platform/*`) | 4 |
| Tenant management (`/api/v2/tenants/me/*`) | 3 |
| Admin (`/api/v2/admin/*`) | 4 |
| Superadmin (`/api/v2/superadmin/*`) | 3 |
| **Total new endpoints** | **20** |

| Middleware (FastAPI deps) | Count |
|---|---|
| `require_auth`, `require_core`, `require_role`, `require_permission`, `require_tenant_admin`, `require_platform_admin` | **6** |

(Spec asked for 6 middleware — matched exactly. Spec mentioned the endpoint groups without a hard count; the proposal materializes 20 distinct routes spread across the 5 groups.)

---

## 3.11 Error response shape (uniform)

All v2 endpoints return errors as:

```json
{
  "error": {
    "code": "rbac.permission_denied",
    "message": "Role 'banker' lacks permission credit.offer:approve in tenant 'credicefi'.",
    "details": {
      "resource": "credit.offer",
      "action": "approve",
      "scope": "tenant"
    }
  }
}
```

Codes are prefixed by domain:
- `auth.invalid_credentials`, `auth.token_expired`, `auth.token_revoked`
- `rbac.permission_denied`, `rbac.role_not_held`, `rbac.subscription_inactive`
- `admin.cross_tenant_forbidden`, `admin.user_exists`

---

## 3.12 Out of scope (for Sprint 1)

- Password reset / email verification flow.
- MFA enrollment endpoints (`mfa_enabled` column exists but no enrollment route).
- SSO / SAML / OIDC federation.
- Audit log exposure as an API (data lives in `audit_events`, `audit_logs`; API on top is Sprint 2+).
- Role templates editor (only superadmin can create templates; tenant-specific role customization UI is Sprint 2+).
