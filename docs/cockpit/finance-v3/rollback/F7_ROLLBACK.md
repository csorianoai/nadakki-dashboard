# F7 Rollback — Hardening + Anchor Reconciliation

**Phase:** F7  
**Scope:** Anchor endpoint, E2E/a11y/visual tests, completion docs

---

## Frontend rollback

1. Revert PR merging F7 hardening branch.
2. Optional: disable anchor UI tests via excluding `e2e/cockpit/` from CI.
3. Finance routes F0–F6 unaffected if only F7 test/docs reverted.

## Backend rollback

1. Revert migration `090_finance_core_mrr_all.py` and `/reconciliation/anchor` endpoint.
2. Or Alembic downgrade to `089`:
   ```bash
   alembic downgrade 089
   ```

## Data impact

- Read-only — no mutations.
- Anchor endpoint is diagnostic only.

## Owner

Tier 2 — Ramon.
