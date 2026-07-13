# F5 Rollback — Tenant×Core Matrix

**Phase:** F5  
**Route:** `/cockpit/finance/matrix`  
**Backend:** migration `088`, `GET /api/v1/cockpit/finance/matrix`

---

## Frontend rollback (instant)

1. Set `NEXT_PUBLIC_COCKPIT_FINANCE_MATRIX_ENABLED=false` in Vercel.
2. Redeploy — tab Matriz oculta en `FinanceSubNav`; `/cockpit/finance/matrix` → 404.

## Backend rollback

1. Revert PR merging `088_finance_core_matrix.py` and matrix router endpoint.
2. Or Alembic downgrade to `087`:
   ```bash
   alembic downgrade 087
   ```
3. Drops `cockpit_matrix_generate` SECURITY DEFINER function.

## Data impact

- Read-only aggregation — no data mutations.
- Revenue F2 (`/finance/mrr/by-core`) unaffected.

## Verification after rollback

- `GET /api/v1/cockpit/finance/matrix` → 404
- Revenue + Population + Registry tabs still functional

## Owner

Tier 2 — Ramon.
