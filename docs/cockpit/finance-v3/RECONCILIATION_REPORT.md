# Anchor Reconciliation Report — Finance Cockpit v3.5

**Phase:** F7  
**Date:** 2026-07-13  
**Status:** GREEN  
**Priority:** — (no P0 mismatches)

---

## Production baseline

| Metric | Value |
|--------|-------|
| Active tenants | 18 |
| Plan | Free (`price_monthly = 0`) |
| Global MRR | RD$0.00 |
| ARR proyectado | RD$0.00 |
| Profesionales | 44 |

---

## 5-source anchor (margin ε = 0)

| # | Source | Field | Value | Match |
|---|--------|-------|-------|-------|
| 1 | `GET /finance/kpis` | `total_mrr` | 0 | ✅ |
| 2 | `GET /finance/mrr/by-core` | `Σ cores[].mrr` | 0 | ✅ (attributable) |
| 3 | `GET /finance/matrix?metric=mrr` | unique tenant MRR sum | 0 | ✅ |
| 4 | `GET /finance/tenants/{id}/overview` × 18 | `Σ finance.mrr_contribution` | 0 | ✅ |
| 5 | `cockpit_finance_mrr_all()` | `SUM(mrr_calculated)` | 0 | ✅ |

**Gate:** All unique-tenant sums identical with ε=0.

---

## Attribution note

`mrr_by_core_sum` uses attributable model — may exceed global MRR when paid plans span multiple cores. At current production baseline (all Free), attributable sum equals global.

Matrix uses **unique tenant MRR per row** (max cell value), not `row_total` (which double-counts multi-core attribution).

---

## Endpoint

`GET /api/v1/cockpit/finance/reconciliation/anchor` — single call returns all 5 sources + `ok` boolean.

## Tests

- Backend: `tests/cockpit/test_cockpit_finance_anchor_router.py`
- Frontend: `tests/cockpit/finance-v3/anchor-reconciliation.test.ts`
