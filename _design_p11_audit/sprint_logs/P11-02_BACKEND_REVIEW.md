# P11-02 Backend Review

Date: 2026-05-11
Reviewer: Manus
Commit reviewed: 90f3e37e

## Summary
**GO WITH MINOR RECOMMENDATIONS**

The RBAC implementation in `backend/db/setup.py` and `scripts/init_local_db.py` successfully follows the project's dialect-aware pattern. It implements the 5 core RBAC tables, extends the `users` table, and seeds the required data idempotently for both PostgreSQL and SQLite. The seed data coverage is comprehensive for the current sprint goals.

## Tables Review
- **platform_cores**: Implemented correctly in both dialects. Uses `gen_random_uuid()` in PG and static UUIDs in SQLite. Includes all required fields (`core_name`, `display_name`, `icon`, `category`, `description`, `enabled`, `version`).
- **platform_role_templates**: Implemented correctly. Establishes the relationship with `platform_cores` and enforces uniqueness on `(core_name, role_key)`.
- **platform_role_permissions**: Implemented correctly with cascading deletes from templates. Enforces uniqueness on `(template_id, resource, action)`. The `effect` column defaults to 'allow' with a check constraint.
- **tenant_subscriptions**: Implemented correctly. Links tenants to cores with cascading deletes on the tenant side. Enforces uniqueness on `(tenant_id, core_name)`.
- **user_tenant_roles**: Implemented correctly. Links users, tenants, and role templates. Enforces uniqueness on `(user_id, tenant_id, template_id)`. RLS is correctly applied in PostgreSQL by casting `tenant_id` to `::uuid`.

*Note on `users` table extension*: The addition of `password_hash`, `is_active`, `mfa_enabled`, and `last_login_at` is handled gracefully in both dialects (using `IF NOT EXISTS` in PG and try/except blocks in SQLite).

## Seed Data Analysis
- **Coverage**: 100% of the requested seed data is present.
  - 9 cores (5 active, 4 future placeholders).
  - 18 role templates covering credit, legal, marketing, sic, and platform.
  - 45 permissions mapped correctly to the templates.
- **Gaps identified**:
  - The `platform_superadmin` role has wildcard permissions `("*", "*")`, which is powerful but expected. However, there is no explicit `deny` effect used in the seed data to restrict specific actions for lower roles, relying entirely on the absence of an `allow` record.
  - The `tenant_admin` role lacks explicit permissions to manage `tenant_subscriptions` (only has `read`), which might be intentional if billing is strictly handled by `billing_admin`, but worth noting.
- **Recommendations**:
  - Consider adding ORM models in `backend/db/models.py` for the new RBAC tables to ensure consistency if SQLAlchemy ORM is used elsewhere in the application.
  - Ensure that the Alembic migration `012_rbac_dynamic.py` (mentioned in comments) is actually created and merged, as it was not found in the current tree during the audit.

## Code Quality
- **Pattern compliance**: **OK**. The code strictly follows the established `_PG_*` and `_SQLITE_*` separation pattern.
- **Idempotency**: **VERIFIED**. 
  - PostgreSQL uses `ON CONFLICT DO NOTHING`.
  - SQLite uses `INSERT OR IGNORE`.
  - The `users` table ALTER statements in SQLite are wrapped in try/except blocks that specifically catch and ignore "duplicate column" errors.
- **Multi-dialect support**: **OK**. The `run_setup()` function correctly branches logic based on the dialect, and `scripts/init_local_db.py` properly forces the SQLite dialect for local development.

## Sign-off
**GO for integration.** The RBAC backbone is solid, idempotent, and respects the dialect-aware constraints of the project. The seed data matches the Sprint 0 specifications perfectly. Proceed with the Auth V2 API implementation (Phase D) relying on this structure.
