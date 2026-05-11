# Test Plan: Auth V2 API

Date: 2026-05-11
Sprint: 1, P11-02 FASE D
Author: Manus

## Test Fixtures Required

The following fixtures must be created in a dedicated test database before any test suite runs. All fixtures should be created via the `conftest.py` helpers and torn down after each test session.

**Users:**

| Email | Role Template | Tenant |
|---|---|---|
| `admin@credicefi.com` | `tenant_admin` | credicefi |
| `banker@credicefi.com` | `credit_officer` | credicefi |
| `dealer@credicefi.com` | `dealer` | credicefi |

**Tenants:**

| Slug | Subscribed Cores |
|---|---|
| `credicefi` | credit, legal |
| `banco-piloto-rd` | credit, marketing |

Role assignments are made via `user_tenant_roles` linking each user to the appropriate `platform_role_templates` entry. All users must have `is_active = true` and a valid `password_hash` (bcrypt of a known test password).

**Test Database:** Use an in-memory SQLite instance (via `aiosqlite`) for isolation. Tables must be re-created before each test module and cleaned up after. Override the `get_db` FastAPI dependency in `conftest.py` to inject the test engine.

## Test Scenarios

### Login — `POST /api/v2/auth/login`

| # | Scenario | Expected |
|---|---|---|
| 1 | Valid credentials, no `tenant_slug` | 200 + `access_token` + `refresh_token` + `user_info` with default tenant |
| 2 | Wrong password | 401 |
| 3 | Email not found | 401 |
| 4 | Disabled user (`is_active = false`) | 403 after password check passes |
| 5 | No tenant assignments in `user_tenant_roles` | 403 |
| 6 | Valid credentials + valid `tenant_slug` | 200 with `tenant_slug` context in token claims |
| 7 | Valid credentials + `tenant_slug` user has no access to | 403 |
| 8 | Invalid email format (e.g., `notanemail`) | 422 |

### Refresh — `POST /api/v2/auth/refresh`

| # | Scenario | Expected |
|---|---|---|
| 9 | Valid refresh token | 200 + new `access_token` + new `refresh_token` |
| 10 | Expired refresh token | 401 |
| 11 | Access token used as refresh token (`token_type != "refresh"`) | 401 |
| 12 | Tampered token (signature invalid) | 401 |
| 13 | Refresh from a user whose `is_active` was set to `false` after token issuance | 403 |

### Logout — `POST /api/v2/auth/logout`

| # | Scenario | Expected |
|---|---|---|
| 14 | Valid access token | 204 No Content |
| 15 | Token is blacklisted after logout (verify in token blacklist store) | Token present in blacklist |
| 16 | Use the blacklisted token on `GET /api/v2/auth/me` | 401 |

### Me — `GET /api/v2/auth/me`

| # | Scenario | Expected |
|---|---|---|
| 17 | Valid access token | 200 + `user_info` + `tenant` + `roles` array |
| 18 | No `Authorization` header | 401 |
| 19 | Invalid Bearer format (e.g., `Bearer` with no token) | 401 |
| 20 | Expired access token | 401 |

### Switch Tenant — `POST /api/v2/auth/switch-tenant`

| # | Scenario | Expected |
|---|---|---|
| 21 | Valid `tenant_id` the user has access to | 200 + new token pair scoped to new tenant |
| 22 | Valid `tenant_slug` the user has access to | 200 + new token pair |
| 23 | User has no `user_tenant_roles` entry for the target tenant | 403 |
| 24 | Neither `tenant_id` nor `tenant_slug` provided in body | 400 |
| 25 | Both `tenant_id` and `tenant_slug` provided (conflicting) | 200 — `tenant_id` wins |

### Switch Role — `POST /api/v2/auth/switch-role`

| # | Scenario | Expected |
|---|---|---|
| 26 | Valid role assignment (`template_id` exists in `user_tenant_roles`) | 200 + token with reordered active role |
| 27 | Role not assigned to user in current tenant | 403 |
| 28 | Switch to current active role (no-op) | 200 — idempotent response |

### Middleware Dependency Tests

These tests verify the FastAPI dependency functions directly, not the endpoints. They should be tested via a minimal test router that applies each dependency.

| # | Dependency | Scenario | Expected |
|---|---|---|---|
| 29 | `require_auth` | Missing `Authorization` header | 401 |
| 30 | `require_auth` | Header present but invalid format | 401 |
| 31 | `require_auth` | Token present in blacklist | 401 |
| 32 | `require_core` | Tenant does not have an active subscription to the required core | 403 |
| 33 | `require_core` | Tenant has an active subscription | Pass — no exception raised |
| 34 | `require_role` | User's active role does not match the required role | 403 |
| 35 | `require_role` | User's active role matches | Pass |
| 36 | `require_permission` | User's role has no matching permission record | 403 |
| 37 | `require_permission` | User's role has a direct permission match | Pass |
| 38 | `require_permission` | User's role has a wildcard permission (`resource.*`, action `*`) | Pass |
| 39 | `require_tenant_admin` | User's active role is not `tenant_admin` | 403 |
| 40 | `require_platform_admin` | User's active role is not `platform_superadmin` | 403 |

## Implementation Notes

The test suite should be structured as follows:

```
tests/
  auth_v2/
    conftest.py          # DB override, user/tenant/role fixture helpers
    test_login.py        # Scenarios 1–8
    test_refresh.py      # Scenarios 9–13
    test_logout.py       # Scenarios 14–16
    test_me.py           # Scenarios 17–20
    test_switch_tenant.py # Scenarios 21–25
    test_switch_role.py  # Scenarios 26–28
    test_middleware.py   # Scenarios 29–40
```

**Framework:** `pytest` + `httpx.AsyncClient` + `pytest-asyncio`. All tests must be `async def` and decorated with `@pytest.mark.asyncio`.

**Fixture pattern:** The `conftest.py` must override `get_db` using `app.dependency_overrides` to inject a test SQLite engine. Helper functions `create_test_user(email, password, is_active=True)`, `create_test_tenant(slug, cores=[])`, and `assign_role(user_id, tenant_id, role_key)` must be provided as async fixtures.

**Token blacklist:** If the production implementation uses Redis for the blacklist, the test suite should mock the Redis client with an in-memory dictionary to avoid external dependencies in CI.

## Coverage Goals

| Area | Target |
|---|---|
| Endpoint coverage | 100% (6 endpoints) |
| Middleware dependency coverage | 100% (6 dependencies) |
| Error paths | ≥ 90% |
| Edge cases | ≥ 80% |

## Sign-off Criteria

The Auth V2 implementation is considered production-ready when all 40 test cases pass, overall code coverage exceeds 90%, there are zero flaky tests across 3 consecutive CI runs, and a manual smoke test on the Render staging environment confirms the full login → switch-tenant → logout flow for the `credicefi` tenant.
