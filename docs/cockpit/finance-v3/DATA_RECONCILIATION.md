# DATA RECONCILIATION — Finance Cockpit v3.1

**Phase:** F1  
**Implementation:** `lib/cockpit/finance-v3/reconciliation.ts`

---

## Monetary baseline (production truth)

- 18 active tenants in `cockpit_subscriptions`, all on **Free** plan (`price_monthly = 0`).
- **MRR total = RD$0.00** is correct live data, not a bug.
- UI copy when all free: *"Sin suscripciones pagadas actualmente. N tenants en plan Free."*

---

## Core formulas

| Metric | Formula | Notes |
|--------|---------|-------|
| **ARR** | `MRR × 12` | `projectArr()` — exact, no rounding drift in tests |
| **MRR global** | Sum of tenant `mrr_contribution` | Must reconcile within ε=0.01 |
| **MRR by core** | Sum of core `mrr` rows | May exceed global (see below) |

---

## MRR attribution model

**Decision: MRR attributable per core (double-count allowed at core level, not at tenant total).**

A tenant paying one subscription that spans Legal + Credit Hub appears once in tenant MRR sum. Core breakdown may attribute the same payment to multiple cores for visibility — core row sum **may exceed** global MRR.

When `coreSum > globalMrr`:
- UI shows warning from `reconcileMrr().warnings`
- Badge `DERIVED` if core split is calculated, not metered per core
- Never hide the discrepancy

If proportional split is introduced later:
- Set `data_source: "derived"` or `"estimated"`
- Document `calculation_method` in envelope `warnings`

---

## Reconciliation checks (H6)

```typescript
reconcileMrr(globalMrr, tenantRows, coreRows)
```

| Check | Pass condition |
|-------|----------------|
| Tenant sum | `|globalMrr - Σ tenant.mrr_contribution| ≤ 0.01` |
| ARR | `arr === globalMrr * 12` |
| Core sum | `coreSum > globalMrr` → warning only (attributable) |
| `data_source=none` | Financial KPIs show "sin data", not `RD$0.00` |
| `data_source=live` + MRR=0 | Show `RD$0.00` with REAL badge |

---

## Currency and locale

- Display: `Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })`
- Contract field: `currency: "DOP"` on all monetary envelopes
- Never display MX$
- USD values require explicit `currency: "USD"` + conversion note in `warnings`

---

## Cross-view reconciliation (F6/F7)

| View | Must match |
|------|------------|
| Revenue KPIs | Matrix column totals (metric=mrr_contribution) |
| Population top tenants | Matrix row activity (metric=active_users) |
| Tenant detail finance block | Revenue tenant row for same `tenant_id` |

Tests added in F6/F7 phases.

---

## Matrix totals

- Column totals: sum of non-null cells per core
- Row totals: sum for active metric only
- Null cell ≠ 0 — display "—" with `status: "empty"`
