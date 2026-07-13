# Evidence Ledger — Finance Cockpit v3.1

| ID | Requisito | Implementación | Tests | Evidencia | Estado |
|----|-----------|----------------|-------|-----------|--------|
| F0-01 | Inventario componentes cockpit | `docs/cockpit/finance-v3/F0_BASELINE.md` §0.1 | — | Paths verificados en repo | **VERIFIED** |
| F0-02 | Baseline lint | `npm run lint` | — | Exit 0, 10.8s, SHA e260bea | **VERIFIED** |
| F0-03 | Baseline typecheck | `npm run typecheck` tras limpiar `.next` | — | Exit 0, 34.9s | **VERIFIED** |
| F0-04 | Baseline Jest cockpit | `tests/cockpit/*` | 6/6 PASS | 2.0s | **VERIFIED** |
| F0-05 | Baseline Jest global | `npm run test:run` | 1230/1320 PASS | 38 suites fail pre-existing | **VERIFIED** (deuda separada) |
| F0-06 | Baseline build | `npm run build:webpack` | — | Exit 0, 188.7s | **VERIFIED** |
| F0-07 | Probe population live | curl Render | — | 401 (existe) | **VERIFIED** |
| F0-08 | Probe finance absent | curl Render 2026-07-13 refresh | — | **401** kpis/mrr/tenant-financials (deployed, auth required) | **VERIFIED** (updated) |
| F0-09 | Probe registry absent | curl Render 2026-07-13 refresh | — | **401** professions (deployed, auth required) | **VERIFIED** (updated) |
| F0-10 | Tenant home path | `lib/auth/auth-context.tsx` | — | `/` para superadmin/admin | **VERIFIED** |
| F0-11 | Protected tenant UUIDs | grep repo | — | 3 UUIDs documentados | **VERIFIED** |
| F0-12 | Screenshots cockpit | Playwright/manual | — | No capturados F0 | **BLOCKED_EXTERNAL** (login) |
| F0-13 | Curl autenticado 200 | dashboard session | — | No JWT en agente | **BLOCKED_EXTERNAL** |
| F0-14 | Hypothesis ledger H1–H15 | `HYPOTHESIS_LEDGER.md` | — | F0 rows completas | **VERIFIED** |
| F1-01 | Contratos Zod finance-v3 | `lib/cockpit/finance-v3/` | 22/22 PASS | CONTRACTS.md | **VERIFIED** |
| F1-02 | DataTruthBadge 7 estados | `data-truth.ts` + mapping | 16 badge tests PASS | F1H enum expansion | **VERIFIED** |
| F1H-01 | Remove estimated state | `envelope.ts` | schema test PASS | v3.5 override | **VERIFIED** |
| F1H-02 | PARTIAL/STALE/ERROR badges | `DataTruthBadge.tsx` | retry test PASS | v3.5 override | **VERIFIED** |
| F1-03 | DATA_RECONCILIATION | `reconciliation.ts` | 3 tests PASS | DATA_RECONCILIATION.md | **VERIFIED** |
| F1-04 | Feature flags | `flags.ts` | — | CONTRACTS.md | **VERIFIED** |
| F1-05 | Population normalizer | `normalize/population.ts` | contract test PASS | backend router shape | **VERIFIED** |
| F2-01 | Exit UX 3 caminos | PR #310 rama `fix/cockpit-exit-nav` | — | No en main | **IMPLEMENTED_UNVERIFIED** |
| F2-01 | Finance revenue UI | `components/cockpit/finance/revenue/*` | 6 normalize tests PASS | `/cockpit/finance/revenue` | **VERIFIED** |
| F2-02 | Finance sidebar + sub-nav | `CockpitSidebar`, `FinanceSubNav` | cockpit tests PASS | `COCKPIT_FINANCE_ENABLED` | **VERIFIED** |
| F2-03 | API client + normalizers | `lib/cockpit/api/finance.ts` | finance-normalize.test.ts | fetchOrDemo on 404 | **VERIFIED** |
| F3-01 | Revenue live MRR=0 | — | — | — | **NOT_STARTED** |
| F4-01 | Population 7 sub-vistas | `finance-ui/f3-f4` | — | PRs CLOSED | **NOT_STARTED** on main |
| F5-01 | Registry CRUD | `finance-ui/f5` + backend F5 | — | 404 prod | **NOT_STARTED** |
| F6-01 | Matrix aggregated endpoint | — | — | — | **NOT_STARTED** |
| F7-01 | Tenant overview endpoint | — | — | — | **NOT_STARTED** |
| F8-01 | Hardening pyramid | — | — | — | **NOT_STARTED** |
