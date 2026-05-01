# Phase 1.5 Blocker — `DEFAULT_CREDIT_TENANT_ID` resolution

## Status

**RESOLVED** (2026-05-01, Cesar approval).

Cross-repo investigation showed `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` is the **canonical Credicefi** tenant id for Credit Core (frontend constant, `.env.example`, backend `validation_output.txt` `default_tenant`, and `validate-bank-portal.ps1`). It is **not** an orphan and must **not** carry `@deprecated`. The blocker file `BLOCKER_phase1.5.md` is retained as an audit trail; the resolution is applied in commit **`fix(forge): close Phase 1.5 blocker — DEFAULT_CREDIT_TENANT_ID is canonical`** (see repo history for the exact hash on `feat/forge-redesign-v3`).

For Banco Piloto RD’s Credit pilot UUID, documentation remains in **`TOKEN_MIGRATION_MAP.md`** / investigation notes: **`550e8400-e29b-41d4-a716-446655440099`** (backend `SECOND_TENANT_PILOT.md`), not the RFC nil `…440000`.

---

## Prior investigation (archived summary)

The full evidence table, Pattern D classification, and options A/B/C are preserved in git history on commits before the resolution commit. Optional condensed grep: `_design/_inventory/blocker_grep_results.txt`.
