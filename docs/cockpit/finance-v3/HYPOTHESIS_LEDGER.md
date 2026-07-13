# Hypothesis Ledger — Finance Cockpit v3.1

**Date:** 2026-07-13  
**Phase:** F0 (recon)  
**Rule:** Cada hipótesis se prueba antes de implementar la fase que la cubre.

---

## F0 — Resultados adversariales

| ID | Hipótesis | Prueba F0 | Resultado | Acción |
|----|-----------|-----------|-----------|--------|
| **H1** | El requisito ya existe | Buscar `finance-ui/*`, `components/cockpit/finance`, PRs #305–309 | **CONFIRMADA** — frontend completo en ramas cerradas; **ausente en main** | Port selectivo en `finance-v3/*`, no duplicar ciego |
| **H2** | Documentación desactualizada | `BACKEND_ENDPOINT_MAP.md` vs curl producción | **PARCIAL** — mapa correcto para network/credit; population live no listada explícitamente | Actualizar mapa en F1 |
| **H3** | Endpoint existe pero contrato cambió | Probe population 401 vs finance 404 | **CONFIRMADA** — population desplegado; finance/registry no | Contratos F1 deben validar contra response real post-login |
| **H4** | UI ok con datos vacíos/null | Revisar `fetchOrDemo`, `demo.ts`, `NetworkHealthCard` | **RIESGO** — `data_source:"none"` puede mostrarse como DEMO; revenue debe tratar `0` ≠ `null` | Zod + UI rules en F1/F3 |
| **H5** | Rol incorrecto / sesión | `CHAdminAccessGuard`, `CockpitContext.isTenantAdminOnly` | **CODE-VERIFIED** — guard existe; curl sin JWT → 401 | Tests rol en F2/F5; no probe tenant_admin en F0 |
| **H6** | Totales no reconcilian | Prod: 18 tenants Free, MRR=0 | **CONFIRMADA como estado real** | ARR=MRR×12; sumas deben ser 0 hasta planes pagados |
| **H7** | Tenant sin cores | `mergeToSixCores` rellena 6 cards con demo | **RIESGO** — ficha tenant debe distinguir habilitado vs stub | F7 empty states |
| **H8** | Core sin profesiones | Population backend tiene 18 profesiones / 5 cores | **LIVE esperado** | Empty state accionable en F4 |
| **H9** | Backend lento/parcial | Render cold start documentado (8s timeout auth) | **CONOCIDO** | Partial failure UI por panel en F3/F4 |
| **H10** | Matriz N×M requests | No hay UI matrix en main; `finance-ui` no incluye matrix | **PREVENIDO** — endpoint agregado obligatorio F6 | Prohibir loops client-side |
| **H11** | CRUD viola aislamiento | Registry 404 en prod; sin mutación posible hoy | **NO PROBADO en runtime** | curl tenant_admin POST → 403 en F5 |
| **H12** | Nuevo código rompe cockpit | Baseline: `tests/cockpit` 6/6, build PASS en main | **PASS F0** | Regresión por fase |
| **H13** | Datos simulados disfrazados | `fetchOrDemo` + `DataTruthBadge` | **MITIGADO** si badge visible; **RIESGO** si demo sin badge en revenue | `data_source` envelope obligatorio F1 |
| **H14** | Presentación engañosa (moneda) | `useCockpit().currency` default DOP; `TenantContext` default USD en settings | **RIESGO** — dos fuentes currency | Unificar `es-DO`/DOP en finance views |
| **H15** | Test verde no prueba real | `tests/cockpit` solo grep separación fetch; sin E2E cockpit | **CONFIRMADA** | E2E golden paths F2+ |

---

## F2 — Corrección contrato (H-2-N)

| ID | Hipótesis | Prueba | Resultado | Acción |
|----|-----------|--------|-----------|--------|
| **H-2-N** | `/finance/tenants/financials` 404 se marca DEMO | `fetchOrNone` + test 404→none | **VERIFIED_FIX** | Endpoint no desplegado → `data_source=none`, badge NONE hasta backend F5 |

---

## F3 — Hipótesis específicas (10)

| ID | Hipótesis | Prueba F3 | Resultado | Acción |
|----|-----------|-----------|-----------|--------|
| **H3-1** | Population endpoints live con JWT | Probe 401 + normalizers | **PENDING** | Contract tests contra shape router 086 |
| **H3-2** | Fallo parcial no tumba tab | `Promise.allSettled` por sub-tab | **PENDING** | 1 endpoint falla, otros renderizan |
| **H3-3** | `core_name` backend ≠ UI `credit_hub` | Map `credit`→Credit Hub chip | **PENDING** | `POPULATION_API_CORES` |
| **H3-4** | Core sin profesiones muestra empty accionable | by-core vacío | **PENDING** | Link Registro |
| **H3-5** | Familias backend-driven | Dropdown desde seed + API | **PENDING** | Query `?family=` |
| **H3-6** | Digital agents placeholder → NONE | `/digital-agents` zeros | **PENDING** | NONE badge, no inventar |
| **H3-7** | Actividad sin telemetría → NONE | No endpoint `/activity` | **VERIFIED_ABSENCE** | Tab NONE completo |
| **H3-8** | tenant_admin recibe 403 | Backend tests population | **VERIFIED** | CHAdminAccessGuard + backend 403 |
| **H3-9** | Deep-link `?tab=&family=` | URLSearchParams sync | **VERIFIED** | Router replaceState |
| **H3-10** | 404 nunca DEMO en population | `fetchOrNone` pattern | **VERIFIED** | H-2-N pattern en finance |

---

## F4 — Hipótesis específicas (10)

| ID | Hipótesis | Prueba F4 | Resultado | Acción |
|----|-----------|-----------|-----------|--------|
| **H4-1** | Registry endpoints requieren platform_superadmin | Tests A–E backend + layout guard | **VERIFIED** | `require_platform_superadmin` |
| **H4-2** | tenant_admin POST/PATCH/DELETE → 403 real | test_a + test_c | **VERIFIED** | No simulación frontend |
| **H4-3** | Duplicate role_code mismo core → 409 | Router + UI error | **VERIFIED** | Sin ON CONFLICT upsert |
| **H4-4** | Referenced profession → soft delete active=false | migration 087 function | **VERIFIED** | warning PARTIAL_DATA |
| **H4-5** | role_code espacios → 422 | Pydantic + UI SNAKE_CASE | **VERIFIED** | |
| **H4-6** | family vacío → 422 | Pydantic validator | **VERIFIED** | |
| **H4-7** | Mutación invalida cache población by-core | registry-events + ByCoreTab | **VERIFIED** | CustomEvent bus |
| **H4-8** | Audit log en DB post-mutación | cockpit_registry_audit_log | **VERIFIED** | migration 087 |
| **H4-9** | warnings[] con severity en UI | RegistryWarningsBanner | **VERIFIED** | 6 codes contract |
| **H4-10** | Flag registry default ON | flags.ts !== "false" | **VERIFIED** | Rollback doc F4 |

---

## F5 — Hipótesis específicas (10)

| ID | Hipótesis | Prueba F5 | Resultado | Acción |
|----|-----------|-----------|-----------|--------|
| **H5-1** | 1 request agregado carga matriz | `fetchFinanceMatrix` único en load | **VERIFIED** | Sin loops N×M |
| **H5-2** | 18 tenants × N cores en prod | `total_rows` desde SQL | **PENDING** | Gate browser |
| **H5-3** | MRR matriz reconcilia Revenue F2 | `_reconcile_mrr_columns` + test | **VERIFIED** | RECONCILIATION_MISMATCH |
| **H5-4** | NON_ADDITIVE oculta grand_total | aggregation_type gate UI | **VERIFIED** | core_status |
| **H5-5** | metering metrics DISABLED | estimated_cost/margin chips | **VERIFIED** | requires_metering |
| **H5-6** | unallocated_mrr columna separada | SQL mrr branch | **VERIFIED** | No duplicar multi-core |
| **H5-7** | Filtros persisten URL | URLSearchParams sync | **VERIFIED** | country/plan/core |
| **H5-8** | Drill-down tenant+core | Link matrix cell | **VERIFIED** | stub F6 page |
| **H5-9** | Cross-tenant A–E matrix | test_cockpit_finance_matrix_router | **VERIFIED** | 403/401 |
| **H5-10** | CURRENTLY_ONLINE ausente | No metric chip | **VERIFIED_ABSENCE** | HYPOTHESIS_LEDGER |

---

## F6 — Hipótesis específicas (10)

| ID | Hipótesis | Prueba F6 | Resultado | Acción |
|----|-----------|-----------|-----------|--------|
| **H6-1** | 1 request agregado carga tenant | `fetchTenantOverview` único en load | **VERIFIED** | Sin loops N×M |
| **H6-2** | Resolución UUID o slug | SQL `id::text OR slug` | **VERIFIED** | Router acepta ambos |
| **H6-3** | Finance block reconcilia Revenue F2 | `reconcileTenantFinanceWithRevenue` | **VERIFIED** | RECONCILIATION_MISMATCH |
| **H6-4** | Core highlight desde matriz | `?highlighted_core=` ring UI | **VERIFIED** | MatrixCellView link |
| **H6-5** | Email enmascarado en users | SQL mask `a***@domain` | **VERIFIED** | PII mínimo |
| **H6-6** | Cores no habilitados → empty card | users_count=0, mrr=null | **VERIFIED** | "No habilitado" |
| **H6-7** | Tenant 404 → not_found UI | fetch 404 mapping | **VERIFIED** | No demo fallback |
| **H6-8** | Cross-tenant A–E overview | test_cockpit_finance_tenant_overview_router | **VERIFIED** | 403/401 |
| **H6-9** | Flag tenant detail default ON | flags.ts !== "false" | **VERIFIED** | Rollback doc F6 |
| **H6-10** | SECURITY DEFINER checklist 089 | migration REVOKE/GRANT | **VERIFIED** | search_path public |

---

## F1–F8 — Hipótesis pendientes (formular al abrir cada fase)

| Fase | Hipótesis prioritarias |
|------|------------------------|
| F1 | H3, H4, H13, H14 — contratos Zod vs payload real |
| F2 | H5, H12, H15 — tabs, exit UX, regresión shell |
| F3 | H4, H6, H13, H14 — MRR 0 real, no demo como live |
| F4 | H8, H9, H13 — 7 sub-vistas, churn sin inventar |
| F5 | H11 — RBAC mutaciones registry |
| F6 | H10, H6 — single aggregated endpoint |
| F7 | H7, H5 — hardening + anchor reconciliation |
| F8 | H12, H15 — pyramid completo |

---

## Autoevaluación 5-capas — F0

| Capa | Score | Notas |
|------|-------|-------|
| A Correctitud funcional | 95 | Inventario y probes completos; browser pending |
| B Correctitud de datos | 90 | Sin JWT no se validó shape live |
| C Seguridad | 100 | Guards/localizados; sin cambios |
| D Regresión | 100 | Baseline cockpit verde |
| E Operabilidad | 85 | Screenshots y curl auth pendientes humanos |

**F0 puede cerrar gate** — deuda P2 documentada, no P0/P1.
