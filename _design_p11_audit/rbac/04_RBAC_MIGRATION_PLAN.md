# 04 — RBAC Migration Plan + Executive Summary

**Audit closes:** 2026-05-10
**Inputs:** FASE 1 (`01_CURRENT_AUTH_STATE.md`), FASE 2 (`02_RBAC_SCHEMA_PROPOSAL.md`), FASE 3 (`03_RBAC_API_PROPOSAL.md`).
**Status:** Audit-only. No code deployed, no migration executed, no commits to `nadakki-ai-suite`.

---

## EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| **Auth gaps detected today** | 20 (2 CRITICAL, 8 HIGH, 8 MEDIUM, 2 LOW) |
| **New DB tables** | 5 (`platform_cores`, `platform_role_templates`, `platform_role_permissions`, `tenant_subscriptions`, `user_tenant_roles`) |
| **Existing tables extended** | 1 (`users` — +4 columns: `password_hash`, `is_active`, `mfa_enabled`, `last_login_at`) |
| **New API endpoints** | 20 under `/api/v2/*` |
| **Endpoints modified** | 0 in Sprint 1 (legacy surface coexists via shim); ~200 deprecated for Sprint 2 |
| **New middleware (FastAPI deps)** | 6 |
| **Sprint 1 backend hours** | **40–55h** (schema + auth API basics + middleware + seed) |
| **Sprint 2 backend hours** | **55–75h** (admin APIs, frontend integration support, legacy deprecation) |
| **Combined Sprint 1 + 2** | **~95–130h** |

### Top 3 risks

1. **CRITICAL — Hardcoded admin keys in `admin_auth.py`** are in version control. Any rotation of those keys is breaking for current admin clients but MUST happen as part of Sprint 1. Mitigation: ship the `platform_superadmin` role and require all admin clients to migrate within Sprint 1.
2. **HIGH — `tenants.id` type drift (TEXT vs UUID treated as both)** could cause silent FK failures in `user_tenant_roles`/`tenant_subscriptions` when joining with tables that cast `tenant_id::uuid`. Mitigation: new tables use TEXT consistently; explicit type-check in seed script.
3. **HIGH — Legacy `X-Tenant-ID` trust surface** must remain functional during the coexistence window. Any bug in the v2 shim that injects `X-Tenant-ID` from JWT could leak cross-tenant data. Mitigation: feature flag + shadow-mode (log mismatches but don't enforce) for first 2 weeks.

### Quick wins (≤ 1 day each)

- **QW1** — Move `ADMIN_KEYS` out of `admin_auth.py` source into env vars (1h). Doesn't require RBAC schema; just unblocks the worst leak.
- **QW2** — Register `SICAuthMiddleware` in `main.py` for SIC routes only (gated by path prefix). Activates JWT enforcement on the routes it was already designed for (2h).
- **QW3** — Run migration `012_rbac_dynamic` + `scripts/rbac_seed_data.py` against staging DB. No code changes, no API exposed yet — just gets the schema in place (2h).
- **QW4** — Backfill `tenant_subscriptions` from existing `tenant_modules` rows in staging. SQL one-liner; validates the schema works against real data (1h).

### Critical path (must happen in order)

```
QW1 (env-ize admin keys)
   └─► 012 migration on staging
         └─► rbac_seed_data.py
               └─► Backfill tenant_subscriptions from tenant_modules
                     └─► Auth v2 endpoints (login/refresh/me)
                           └─► Middleware deps (require_auth + require_role)
                                 └─► Compatibility shim (inject X-Tenant-ID from JWT)
                                       └─► Sprint 1 sign-off → enable feature flag in prod
```

Anything off this path (admin APIs, role-overview dashboard, frontend integration) can run in parallel once the shim is green.

---

## 4.1 Migration plan (schema rollout)

### PASO 1 — Backup DB

Before any DDL on staging or prod:

```bash
# Postgres (prod)
pg_dump --format=custom --no-owner --no-acl \
        --file="nadakki_pre_rbac_$(date +%Y%m%d_%H%M%S).dump" \
        "$DATABASE_URL"

# Verify dump
pg_restore --list "nadakki_pre_rbac_*.dump" | head -50
```

Store the dump in S3 with a 30-day retention.

Verify there are no in-flight Alembic migrations:

```bash
alembic current
# Expect: 011_utf8_cleanup_module_catalog (head)
```

### PASO 2 — Apply migration in staging

```bash
# 1. Confirm head is 011
alembic current

# 2. Dry-run by reading 012 source
alembic upgrade --sql 012  > /tmp/012_dryrun.sql
# Eyeball /tmp/012_dryrun.sql for unexpected statements

# 3. Apply
alembic upgrade 012

# 4. Verify
alembic current  # expect: 012
psql "$DATABASE_URL" -c "\d platform_cores"
psql "$DATABASE_URL" -c "\d user_tenant_roles"

# 5. Seed
python scripts/rbac_seed_data.py
# Expect: "Seeded 9 cores, 18 role templates, ~50 permissions."
```

### PASO 3 — Migrate existing users to RBAC

Two data migrations run after the schema is in place. Both ship as separate one-shot scripts under `scripts/rbac_migrate_*.py` (not part of Alembic; reversible by deleting the inserted rows).

**3a. Backfill `tenant_subscriptions` from `tenant_modules`:**

```sql
INSERT INTO tenant_subscriptions (
    tenant_id, core_name, plan_tier, started_at, status,
    monthly_cost_usd, legacy_module_row_id
)
SELECT
    tm.tenant_id::text,
    pc.core_name,
    COALESCE(t.plan, 'starter') AS plan_tier,
    tm.created_at,
    CASE WHEN tm.enabled THEN 'active' ELSE 'suspended' END AS status,
    0,
    tm.id
FROM tenant_modules tm
JOIN tenants t ON t.id::text = tm.tenant_id::text
JOIN platform_cores pc ON pc.core_name = tm.module_slug
ON CONFLICT (tenant_id, core_name) DO NOTHING;
```

**3b. Migrate existing `users` rows into `user_tenant_roles`:**

Every existing user row gets a `tenant_admin` grant in their `users.tenant_id` tenant. Rationale: today, anyone with a row in `users` is implicitly a tenant operator (no granular role enforcement exists). Promoting them to `tenant_admin` is the closest like-for-like.

```sql
INSERT INTO user_tenant_roles (user_id, tenant_id, core_name, role_template_id)
SELECT
    u.id,
    u.tenant_id,
    'platform',
    rt.id
FROM users u
JOIN platform_role_templates rt
  ON rt.core_name = 'platform'
 AND rt.role_key = 'tenant_admin'
 AND rt.tenant_id IS NULL
ON CONFLICT DO NOTHING;
```

Demote later (Sprint 2) once tenant admins re-grant their teams correctly. Print a count of affected users for the runbook.

### PASO 4 — Validation in staging

Run the following acceptance checks before promoting to prod:

| Check | SQL / curl | Expected |
|---|---|---|
| Cores seeded | `SELECT count(*) FROM platform_cores` | 9 |
| Role templates seeded | `SELECT count(*) FROM platform_role_templates WHERE is_system = TRUE` | 18 |
| Permissions seeded | `SELECT count(*) FROM platform_role_permissions` | ≥ 45 |
| RLS active on subscriptions | `SELECT relrowsecurity FROM pg_class WHERE relname='tenant_subscriptions'` | t |
| Backfilled subs match modules | `SELECT count(*) FROM tenant_modules` vs `SELECT count(*) FROM tenant_subscriptions WHERE legacy_module_row_id IS NOT NULL` | equal |
| User grants migrated | `SELECT count(*) FROM user_tenant_roles` | ≥ `SELECT count(*) FROM users` |
| Auth endpoint healthy | `curl -X POST /api/v2/auth/login -d '{"email":"admin@…","password":"…"}'` | 200 with JWT |
| `me` returns roles | `curl /api/v2/auth/me -H "Authorization: Bearer …"` | roles[] non-empty |
| Permission check works | `require_permission` denies banker → `credit.audit_log:read` | 403 |
| Legacy `/api/v1/*` still works | `curl /api/v1/campaigns -H "X-Tenant-ID: credicefi"` | 200 (shim does not break legacy) |
| Cross-tenant attempt blocked | login as user-A in tenant-A, try `/api/v2/tenants/me/users` with `X-Tenant-ID: tenant-B` | shim discards spoofed header; response scoped to A |

Acceptance: all 11 checks green for 48h on staging before prod promotion.

### PASO 5 — Apply in prod (estimated downtime)

```
Pre-DDL phase           : 0 min downtime (backup, dry-run)
DDL phase               : ~30 sec (all new tables IF NOT EXISTS, single column ALTERs)
Seed phase              : ~5 sec
Backfill phase          : <10 sec for ~hundreds of existing user/tenant rows
Smoke test in prod      : 5 min
Feature flag enable     : 0 downtime (env var toggle + 1 pod restart)

Total advertised downtime: 5 min (conservative).
Real expected: <1 min (DDL is the only blocker; everything else is concurrent).
```

The migration is **online-safe**: all DDL uses `IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN ... DEFAULT ...`. No table rewrites. No long-running locks expected on `users` (Postgres adds nullable columns instantly; the `NOT NULL DEFAULT TRUE` columns trigger a fast-path in PG ≥ 11).

### PASO 6 — Rollback plan

**If migration fails mid-way:**

```bash
alembic downgrade 011
# This drops all 5 new tables and reverts the 4 column adds on users.
# Existing data in tenant_modules / users is untouched.
```

**If migration succeeds but production smoke fails:**

1. Disable feature flag: `unset NADAKKI_RBAC_V2_ENABLED` + restart pods. v2 endpoints unmount; legacy surface unchanged.
2. Leave the schema in place (no harm; tables are empty of operational data).
3. Triage v2 endpoint failure in staging.
4. Re-enable feature flag once the bug is patched.

**If schema must be fully rolled back after data migration:**

1. Disable feature flag (as above).
2. `alembic downgrade 011` — Alembic cascades drop the 5 new tables; the `legacy_module_row_id` link in `tenant_subscriptions` is lost but `tenant_modules` is untouched, so no real data loss.
3. The 4 added columns on `users` are dropped; any `password_hash` values written during v2 are lost. Document this: in the coexistence window, the legacy auth path still uses `_USUARIOS_SIMULADOS` or another shim, so production passwords haven't been migrated yet.

---

## 4.2 Backwards compatibility

### How current code keeps working during migration

| Current behavior | After 012 | Compatibility mechanism |
|---|---|---|
| Endpoints read `X-Tenant-ID` directly | Same | v2 middleware injects `X-Tenant-ID` from JWT into request headers before legacy handlers run |
| `users.role` (VARCHAR) consumed by some code | Untouched | We do NOT drop the column. Reads still work. New code reads from `user_tenant_roles` instead. |
| `admin_auth.py` API keys | Phased out | QW1 moves them to env vars (1h). Sprint 1 then replaces them with `platform_superadmin` role + JWT. Old `X-Admin-Key` route remains for 1 sprint as a shim that mints a `platform_superadmin` JWT. |
| `SICAuthMiddleware` JWT system | Coexists | The new v2 JWT uses a different env secret (`NADAKKI_JWT_SECRET` vs `SIC_JWT_SECRET`) and a different prefix (`/api/v2`). SIC `/auth/login` continues to issue SIC tokens for `/auth/*` and `/sic/*` routes. |
| `module_catalog` / `tenant_modules` | Coexists | Backfilled into `tenant_subscriptions` but `tenant_modules` is not dropped. Sprint 2 task: migrate any code that reads `tenant_modules` to read `tenant_subscriptions`, then drop `tenant_modules`. |

### Feature flag

`NADAKKI_RBAC_V2_ENABLED` (boolean env var). Default `false`. Gates:

1. Whether v2 router is mounted in `main.py`.
2. Whether the `X-Tenant-ID` injection shim activates.
3. Whether `/api/v2/auth/login` accepts requests (returns 503 if false).

Enabled per-environment first (staging → prod). Can be flipped without redeploy by restarting pods after env var change.

### Coexistence period

Duration: **2 weeks minimum** between feature-flag-on-in-prod and Sprint 2 kickoff. In that window:

- v2 tokens are minted for new logins.
- Legacy `X-Tenant-ID`-only clients keep working.
- A daily report counts: (a) legacy-only requests, (b) v2-token requests, (c) header-mismatch warnings from the shim. Goal: drive (a) to zero before Sprint 2 starts.

---

## 4.3 Risks identified

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| MR1 | Migration fails due to data inconsistency (e.g., a `tenant_modules` row references a `module_slug` not in `platform_cores`) | MEDIUM | HIGH | Dry-run backfill SQL on staging first; seed `platform_cores` with the EXACT same slugs as `module_catalog` (already designed this way in `rbac_seed_data.py`). |
| MR2 | Performance degradation due to JOINs at request time (`user_tenant_roles` → `platform_role_permissions`) | MEDIUM | MEDIUM | (a) JWT embeds resolved `perms` at login; only refresh hits DB. (b) Indexes on `(user_id, tenant_id) WHERE active=TRUE` and `(role_template_id, resource, action) WHERE granted=TRUE`. (c) In-process cache keyed by `(user_id, tenant_id)` with TTL = token expiry. |
| MR3 | Users lose access after migration | LOW | CRITICAL | Backfill PASO 3b grants every existing user `tenant_admin`. Conservative — over-grants rather than under-grants. Tenant admins prune in Sprint 2. |
| MR4 | Hardcoded admin keys leak after rotation | HIGH (already leaked) | CRITICAL | Treat the two keys in `admin_auth.py` as compromised. Rotate at Sprint 1 cutover. Issue: `nadakki_admin_2025_master` may be in build logs, screenshots, slack — full rotation requires coordination. |
| MR5 | RLS variable mismatch (`app.tenant_id` vs `app.current_tenant_id`) silently allows cross-tenant reads on new tables | MEDIUM | CRITICAL | New tables use `app.tenant_id` (TEXT). Add an integration test in `tests/db/test_rls.py` for `tenant_subscriptions` and `user_tenant_roles` before flipping the feature flag. |
| MR6 | JWT signing secret fallback (`nadakki-sic-dev-secret-2025` if `SIC_JWT_SECRET` unset) is reused by v2 | LOW | HIGH | v2 uses a separate env var (`NADAKKI_JWT_SECRET`) with a hard-fail (not a fallback) when unset in prod. Same pattern as `sic_auth_service.py` lines 26-28 but stricter. |
| MR7 | Frontend breaks because `LoginResponseV2` shape differs from current SIC `/auth/login` response | HIGH (during integration) | MEDIUM | v2 is a new endpoint; frontend integrates explicitly. SIC `/auth/login` continues to return its current shape. |
| MR8 | Two JWT issuers (SIC + v2) get conflated and validators accept the wrong issuer | MEDIUM | HIGH | v2 tokens include `"iss": "nadakki-v2"` claim. SIC validator rejects non-SIC issuers; v2 validator rejects non-v2 issuers. |
| MR9 | `tenant_subscriptions` backfill includes inactive/expired `tenant_modules` rows, granting access that should be revoked | LOW | MEDIUM | Backfill sets `status = CASE WHEN tm.enabled THEN 'active' ELSE 'suspended' END`. Verify count of `suspended` rows post-backfill. |
| MR10 | The `platform` pseudo-core leaks into customer-facing listings (e.g., `GET /api/v2/platform/cores`) and confuses users | LOW | LOW | Default `?enabled=true&category=core,marketing,analytics,…` filter excludes `category='platform'`. `platform` core is internal-only. |

---

## 4.4 Sprint estimates (realistic)

### Sprint 1 — Schema + Auth API basics (target: 1 sprint, 1 dev)

| Task | Hours |
|---|---|
| QW1 (env-ize admin keys + rotate) | 2 |
| QW2 (register SICAuthMiddleware on SIC paths) | 2 |
| Apply 012 migration to staging + verify | 3 |
| Run rbac_seed_data.py + backfill scripts | 3 |
| Implement `services/auth_service_v2.py` (JWT mint/validate + perm resolver) | 8 |
| Implement 6 FastAPI deps (`require_*`) | 6 |
| Implement 6 auth endpoints (`/api/v2/auth/*`) | 8 |
| Implement 4 platform catalog endpoints | 4 |
| Implement compatibility shim (inject X-Tenant-ID from JWT) | 5 |
| Tests (unit + integration RLS) | 6 |
| Feature flag wiring + staging rollout + smoke | 5 |
| **Sprint 1 subtotal** | **52h** |

### Sprint 2 — Admin APIs + frontend integration + legacy deprecation

| Task | Hours |
|---|---|
| Implement 3 tenant management endpoints | 6 |
| Implement 4 admin endpoints | 8 |
| Implement 3 superadmin endpoints | 6 |
| Frontend SDK / TypeScript types | 6 |
| Frontend `TenantContext` / `AuthContext` rewrite | 12 |
| Demote backfilled `tenant_admin` grants to real roles (data migration) | 4 |
| Deprecate `module_catalog` / `tenant_modules` reads → swap to `platform_cores` / `tenant_subscriptions` | 10 |
| Audit log + observability hooks for permission denials | 4 |
| Performance test (P99 latency for `require_permission`) | 4 |
| Documentation + runbook | 5 |
| Migration to remove legacy admin_auth.py | 6 |
| **Sprint 2 subtotal** | **71h** |

### Combined backend effort

| Phase | Hours | Notes |
|---|---|---|
| Sprint 1 | 52 | Schema + auth basics + middleware + shim |
| Sprint 2 | 71 | Admin APIs + frontend support + legacy removal |
| **Total Sprint 1+2** | **123h** | ~15 working days for 1 engineer |

Schedule risk: assumes existing tests for `tenant_modules` / `module_catalog` keep passing during the swap. If they don't (likely some break in Sprint 2 step 7), add **+10-15h** for test repair.

---

## 4.5 Acceptance criteria (Sprint 1 sign-off)

A reviewer can flip `NADAKKI_RBAC_V2_ENABLED=true` in prod when ALL of these are green:

1. ✅ 012 migration applied to prod. `alembic current` returns `012`.
2. ✅ Seed script run. Counts match (9 cores, 18 role templates, ≥45 permissions).
3. ✅ Backfill scripts run. Every existing `tenant_modules` row has a corresponding `tenant_subscriptions` row.
4. ✅ Every existing `users` row has at least one `user_tenant_roles` grant.
5. ✅ `POST /api/v2/auth/login` accepts a real user (post-backfill) and returns a v2 JWT.
6. ✅ `GET /api/v2/auth/me` with a v2 JWT returns the user's tenant + roles + perms.
7. ✅ `require_permission` denies a banker calling `credit.audit_log:read` (403).
8. ✅ `require_role` allows `platform_superadmin` on any v2 endpoint.
9. ✅ Compatibility shim test: a v2-authenticated request with a spoofed `X-Tenant-ID` header is rewritten to match the JWT.
10. ✅ Legacy `/api/v1/campaigns` still returns 200 with `X-Tenant-ID: credicefi`.
11. ✅ Hardcoded admin keys (`nadakki_admin_2025_master`, `nadakki_admin_credicefi_2025`) are revoked from `admin_auth.py` (or the file is removed entirely).
12. ✅ Integration test `tests/db/test_rls.py` covers `tenant_subscriptions` and `user_tenant_roles` and passes for both `tenant_a` and `tenant_b`.

---

## 4.6 Out-of-scope (deferred to Sprint 3+)

- SSO / OIDC / SAML federation.
- Per-tenant role customization UI.
- Permission denial audit log API.
- MFA enrollment flow.
- Password reset flow.
- Cross-tenant user accounts (a consultant working across multiple tenants from one login). Today's model supports it (`user_tenant_roles` is multi-row per user), but the login flow assumes one tenant at a time. Cross-tenant switching is partially addressed by `/api/v2/auth/switch-tenant`, but a "one-click swap" UX is Sprint 3.
- Removing `users.role` (legacy VARCHAR). Defer until all code paths read from `user_tenant_roles`.
- Dropping `module_catalog` and `tenant_modules` (Sprint 3 cleanup).

---

## 4.7 Open questions for Cesar

1. **Admin key rotation window:** the two keys in `admin_auth.py` need a hard cutover date. Propose: end of Sprint 1 (week 2). Acceptable?
2. **Backfill default role:** every existing user gets `tenant_admin` in their tenant. Confirm — or pick a more conservative default (e.g., `auditor` per core)?
3. **`platform` pseudo-core:** acceptable as an internal implementation detail, or do you want a different name (e.g., `_platform`, `nadakki`)?
4. **`tenant_id` type:** keep TEXT (current) or commit to a follow-up migration to UUID? TEXT is less work; UUID is cleaner long-term. The proposal goes with TEXT — confirm.
5. **Coexistence duration:** 2 weeks min in prod before deprecating legacy. Longer if you want a safer rollout.
