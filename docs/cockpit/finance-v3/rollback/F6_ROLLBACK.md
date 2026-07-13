# F6 Rollback — Tenant Drill-Down

**Phase:** F6  
**Route:** `/cockpit/finance/tenant/{slug}`  
**Backend:** migration `089`, `GET /api/v1/cockpit/finance/tenants/{ref}/overview`

---

## Frontend rollback (instant)

1. Set `NEXT_PUBLIC_COCKPIT_FINANCE_TENANT_DETAIL_ENABLED=false` in Vercel.
2. Redeploy — `/cockpit/finance/tenant/*` → 404; matrix drill-down links fallan gracefully.

## Backend rollback

1. Revert PR merging `089_finance_core_tenant_overview.py` and overview router endpoint.
2. Or Alembic downgrade to `088`:
   ```bash
   alembic downgrade 088
   ```
3. Drops `cockpit_finance_tenant_overview` SECURITY DEFINER function.

## Data impact

- Read-only aggregation — no data mutations.
- Matrix drill-down links remain; detail page shows 404 until re-enabled.

## Verification after rollback

- `GET /api/v1/cockpit/finance/tenants/{ref}/overview` → 404
- Revenue + Matrix + Population + Registry unaffected

## Owner

Tier 2 — Ramon.
