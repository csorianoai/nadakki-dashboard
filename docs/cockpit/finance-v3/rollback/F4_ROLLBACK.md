# F4 Rollback — Registry CRUD

**Phase:** F4  
**Route:** `/cockpit/finance/registry`  
**Backend:** migration `087`, `cockpit_registry_router.py`

---

## Frontend rollback (instant)

1. Set `NEXT_PUBLIC_COCKPIT_FINANCE_REGISTRY_ENABLED=false` in Vercel env.
2. Redeploy dashboard — registry tab hidden; middleware redirects to `/cockpit/finance/revenue`.
3. Layout guard remains but route is unreachable via nav.

## Backend rollback

1. Revert PR merging `087_finance_core_registry_v2.py` and router changes.
2. Or run Alembic downgrade to `086`:
   ```bash
   alembic downgrade 086
   ```
3. Drops `cockpit_registry_audit_log`, `active` columns, and SECURITY DEFINER functions.

## Data impact

- Soft-deleted rows (`active=false`) remain in `core_professions` / `core_entity_types`.
- Audit log rows in `cockpit_registry_audit_log` are preserved until downgrade drops table.
- Hard-deleted rows are not recoverable without DB restore.

## Verification after rollback

- `GET /api/v1/cockpit/registry/professions` → 404 or prior behavior (pre-574).
- `tenant_admin` curl POST → 403 (if router still mounted with old guard).
- Population tabs unaffected (read-only analytics).

## Owner

Tier 2 — Ramon. Escalate to César if migration downgrade needed in production.
