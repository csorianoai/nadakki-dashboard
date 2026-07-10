# BANK_EXPERIENCE_UI_LOOP_v1 — Frontend Report

**Repo:** csorianoai/nadakki-dashboard  
**Executor:** Cursor (autonomous stacked PR loop)  
**Date:** 2026-07-09  
**Verdict:** **COMPLETE** (F0–F5 delivered, no merges)

---

## 1. Phase × criteria matrix

| Phase | Criterion | Status | Evidence |
|-------|-----------|--------|----------|
| **F0** | Baseline build/lint | **PASS** | `main` @ `d7ae2ea`; `npm run build:webpack` + `npm run lint` green |
| **F0** | Paths located | **PASS** | `BankDetailLayout`, `BankDashboardView`, `DealerApplicationDetailView`, `DisbursementPanel`, `operationalClient.ts`, `display-status.ts` |
| **F0** | Bank tabs inventory | **PASS** | Análisis, Documentos, Estipulaciones, Audit, Compliance, Verificaciones, Mensajes; cierre = `DisbursementPanel` (columna derecha) |
| **F0** | API contracts in repo | **MISSING** | Solo `docs/credit/NOTIFICATIONS_API_CONTRACT_v1.md` — contract-first vía `bankExperienceClient.ts` |
| **F1** | Notas internas tab (bank only) | **PASS** | `InternalNotesTab`; tab no existe para dealer |
| **F1** | Append-only notes + badges | **PASS** | POST `.../notes`; sin edit/delete |
| **F1** | Analista asignado + reasignar | **PASS** | `AssignedAnalystSection`; supervisor → modal POST `.../assign` |
| **F1** | 404 graceful | **PASS** | Tab y sección ocultos |
| **F1** | Build/lint/tests | **PASS** | PR #283 |
| **F2** | AmortizationTable | **PASS** | GET `.../amortization`; dealer + bank detail |
| **F2** | Conditions panel | **PASS** | GET/PATCH `.../conditions` en Estipulaciones |
| **F2** | Offer vigencia | **PASS** | `OfferValidityBadge` desde `raw` payload |
| **F2** | Build/lint/tests | **PASS** | PR #284 |
| **F3** | Counter-offer panel | **PASS** | `CounterOfferPanel` → existing `.../counter-offer` |
| **F3** | Offer comparator | **PASS** | `OfferComparePanel` → `.../offers/compare`; 404 hide |
| **F3** | Build/lint | **PASS** | PR #285 |
| **F4** | Bank KPIs | **PASS** | `BankExperienceKpisPanel` → `.../analytics/bank-kpis` |
| **F4** | Empty = no false greens | **PASS** | "Sin actividad en este periodo" |
| **F4** | Build/lint | **PASS** | PR #286 |
| **F5** | Print + export PDF | **PASS** | `PrintExportActions`; `window.print()` + GET `.../pdf/application-summary` |
| **F5** | Build/lint/tests + report | **PASS** | PR #287 (this branch) |

---

## 2. PR stack (merge order F1→F5)

```
main
 └── feat/bank-notes-assign-ui           PR #283
      └── feat/amortization-conditions-ui PR #284
           └── feat/counteroffer-compare-ui PR #285
                └── feat/bank-kpis-ui    PR #286
                     └── feat/print-export-ui PR #287
```

| PR | Branch | Base |
|----|--------|------|
| #283 | `feat/bank-notes-assign-ui` | `main` |
| #284 | `feat/amortization-conditions-ui` | `feat/bank-notes-assign-ui` |
| #285 | `feat/counteroffer-compare-ui` | `feat/amortization-conditions-ui` |
| #286 | `feat/bank-kpis-ui` | `feat/counteroffer-compare-ui` |
| #287 | `feat/print-export-ui` | `feat/bank-kpis-ui` |

Post-squash: rebase next branch onto `main` after each merge (`git rebase main && git push -f`).

---

## 3. Baseline F0 vs final

| Check | F0 (`main`) | Final (`feat/print-export-ui`) |
|-------|-------------|--------------------------------|
| `npm run build:webpack` | ✅ | ✅ |
| `npm run lint` | ✅ | ✅ |
| `bank-experience` tests | — | **7/7** pass |
| Hardcoded UUIDs in touched files | 0 | 0 |

---

## 4. Backend dependencies (contract-first)

| Feature | Endpoints | UI when 404 |
|---------|-----------|-------------|
| F1 Notes | `GET/POST .../notes` | Tab oculto |
| F1 Assign | `GET .../assignment`, `POST .../assign` | Sección oculta |
| F2 Amortization | `GET .../amortization` | Componente oculto |
| F2 Conditions | `GET/PATCH .../conditions` | Panel oculto |
| F3 Compare | `GET .../offers/compare` | Panel oculto |
| F3 Counter | `GET .../counter-offer` | Panel oculto (existente) |
| F4 KPIs | `GET .../analytics/bank-kpis` | Panel oculto |
| F5 Export | `GET .../pdf/application-summary` | Toast error |

---

## 5. Autonomous decisions

1. **`bank_supervisor` → `bank_admin`** — no `bank_supervisor` role_key in repo; reassignment gated on `bank_admin`.
2. **Single `bankExperienceClient.ts`** — mirrors `operationalClient.ts` pattern.
3. **F2 spec truncated** — amortization columns: #, Fecha, Cuota, Capital, Interés, Saldo (standard schedule).
4. **Offer vigencia** — read from `raw.valid_until` / `terms.valid_until`; no invented dates.
5. **GR-12** — each phase ≤2 dirs (`components/credit-hub/{bank,dealer}` + `lib/credit-hub`).

---

## 6. Deferred

None — full F0–F5 scope delivered in stacked PRs.
