# Nauta Cockpit v2 — Reporte de implementación

**Rama:** `feat/nauta-cockpit-v2`  
**Modo:** local only (sin push / sin merge)  
**Referencia visual:** `nauta_portal_v2.html` + specs DESIGN_TOKENS / COMPONENT / LAYOUT / BEHAVIOR

---

## Resumen

Rediseño completo del cockpit `/nauta` según diseño v2 aprobado. Se reutilizan `nautaClient.ts`, hooks existentes y `normalizers.ts`. El shell v2 incluye rail interno (236px), KPI header, 5 vistas y sub-modos del Piso.

---

## Componentes creados (v2)

| Componente | Ruta | Variantes |
|---|---|---|
| `RiskChip` | `lib/nauta/components/v2/RiskChip.tsx` | bajo, medio, alto, critico |
| `StatusPill` | `lib/nauta/components/v2/StatusPill.tsx` | prioridad, listo, laboratorio, concepto |
| `KpiCard` | `lib/nauta/components/v2/KpiCard.tsx` | hero, normal, warn |
| `EmployeeCard` | `lib/nauta/components/v2/EmployeeCard.tsx` | estrella, listo, laboratorio, concepto (+ reservadas en CSS) |
| `SealCard` | `lib/nauta/components/v2/SealCard.tsx` | — |
| `ApprovalRow` | `lib/nauta/components/v2/ApprovalRow.tsx` | — |
| `ActivityFeedItem` | `lib/nauta/components/v2/ActivityFeedItem.tsx` | dot ok/ac/sl/wn |
| `BundleCard` | `lib/nauta/components/v2/BundleCard.tsx` | normal, destacado-E2 (D1) |
| `SegmentedControl` | `lib/nauta/components/v2/SegmentedControl.tsx` | dept / estado / planes |
| `EmptyStateLogro` | `lib/nauta/components/v2/EmptyStateLogro.tsx` | — |
| `NautaKpiHeader` | `lib/nauta/components/v2/NautaKpiHeader.tsx` | grid 5 KPIs |
| `LiveActivityColumn` | `lib/nauta/components/v2/LiveActivityColumn.tsx` | sticky + colapsable |
| `DepartmentSection` | `lib/nauta/components/v2/DepartmentSection.tsx` | D0–D5 |
| `StatusGroupSection` | `lib/nauta/components/v2/StatusGroupSection.tsx` | 4 buckets ciclo de vida |
| `NautaRail` | `lib/nauta/components/v2/NautaRail.tsx` | nav operación + admin |
| `NautaHeader` | `lib/nauta/components/v2/NautaHeader.tsx` | search + reloj AST |

### Vistas

| Vista | Archivo |
|---|---|
| Piso (dept / estado / planes) | `lib/nauta/components/v2/views/PisoView.tsx` |
| Tablero | `lib/nauta/components/v2/views/TableroView.tsx` |
| Expediente E1 | `lib/nauta/components/v2/views/ExpedienteE1View.tsx` |
| Expediente E2 | `lib/nauta/components/v2/views/ExpedienteE2View.tsx` |
| Supervisión | `lib/nauta/components/v2/views/SupervisionView.tsx` |

### Orquestador

- `lib/nauta/components/NautaCockpitView.tsx` — reemplaza implementación PR #248/#249 en `/nauta`
- `lib/nauta/components/NautaLayoutClient.tsx` — tokens, fuentes, `data-tenant`, acento derivado del branding real

---

## Componentes reemplazados (ya no usados en `/nauta`)

| Anterior | Estado |
|---|---|
| `NautaKpiRow` | Reemplazado por `NautaKpiHeader` + `KpiCard` |
| `NautaEmployeeGrid` | Reemplazado por `PisoView` + `EmployeeCard` |
| `NautaExecutePanel` | No incluido en v2 (ejecución vive fuera del diseño aprobado; hook `useNautaCreateRun` sigue disponible) |
| `NautaRunsTable` | No incluido en vista principal v2 |
| `NautaEmptyState` (genérico) | Reemplazado por `EmptyStateLogro` en Supervisión |

**Conservados:** `NautaRunDetailView` en `/nauta/runs/[id]` (fuera del rediseño v2 principal).

---

## Infraestructura nueva

| Archivo | Propósito |
|---|---|
| `lib/nauta/tokens.css` | Variables CSS DESIGN_TOKENS |
| `lib/nauta/nauta-v2.css` | Estilos scoped `.nauta-v2` (pixel-ref HTML) |
| `lib/nauta/nauta-fonts.ts` | Fraunces (opsz), Inter, IBM Plex Mono |
| `lib/nauta/strings.ts` | Microcopy BEHAVIOR_SPEC §9 |
| `lib/nauta/config.ts` | `NAUTA_USD_DOP_RATE`, constantes |
| `lib/nauta/branding.ts` | `--accent*` + `--on-accent-soft` derivados del tenant |
| `lib/nauta/format.ts` | `Intl.NumberFormat('es-DO')`, USD→DOP |
| `lib/nauta/catalogMeta.ts` | 16 fichas, bundles, activity/approvals mock |
| `lib/nauta/employeeModel.ts` | Merge API + catálogo |
| `hooks/nauta/useNautaSummary.ts` | GET `/dashboard/summary` |

---

## Brechas de API (conectado vs mock)

| Dato UI | Fuente actual | Endpoint propuesto |
|---|---|---|
| 16 fichas (role, dept, status catálogo) | `catalogMeta.ts` + overlay `GET /employees` | Ampliar `employees[]` con `risk_level`, `supervisor_ref`, status v2 |
| KPIs header | `GET /dashboard/summary` (fallback estático si 404) | Ya documentado en spec |
| `risk_level`, supervisor | `catalogMeta.ts` | `employees[]` o `role_pack` |
| Métricas por empleado (expedientes) | Static en vistas E1/E2 | `GET /employees/{role_id}/metrics` |
| Feed actividad | `NAUTA_ACTIVITY_MOCK` | `GET /nauta/activity?limit=6` |
| Cola aprobaciones | `NAUTA_APPROVALS_MOCK` | `GET /nauta/approvals` |
| Precios bundles | `NAUTA_BUNDLES` | `GET /nauta/plans` |
| Evidencia SHA (expedientes) | Static | `GET /employees/{role_id}/evidence` |
| `cost_usd_month` → RD$ | `NAUTA_USD_DOP_RATE` en `config.ts` | `cost_dop_month` en summary |
| Deltas KPI (▲ 12.4%) | Static en strings | `*_delta` en summary |

---

## Verificación G5

- [x] `npm run build` — exit 0
- [x] 16 fichas renderizadas una sola vez (merge catálogo, agrupación React por `groupBy`)
- [x] Distribución D0:1 / D1:4 / D2:4 / D3:3 / D4:3 / D5:1 en `catalogMeta.ts`
- [x] Bundles orden D1(destacado) · D4 · D3 · D2 · D0 · D5
- [x] `data-tenant` + variables `--accent*` desde `useTenantBranding().brand_primary`
- [x] `--on-accent-soft` derivado (no `#bcd0fb` fijo en hero)
- [x] Animaciones pulse 2.4s, dot 2.2s, hover .14–.16s + `prefers-reduced-motion`
- [x] Supervisión: 3 contadores sincronizados (rail, KPI warn, banner) + `EmptyStateLogro`
- [x] "Ver como planes" = sub-estado Piso, no ruta nueva; sidebar atajo `/nauta?mode=planes`

---

## Descripción de vistas

### Piso de operaciones
Grid `1fr 300px` con columna actividad sticky/colapsable. Segmented: por departamento (default), por estado, ver como planes (`.piso-wrap.solo`, 4 cols). Click E1/E2 abre expediente.

### Tablero
Grid `1.55fr 1fr`: feed actividad + carga por departamento + retorno del mes.

### Expediente E1 / E2
Head + grid 2 cols: perfil, historial timeline, desempeño, costo, evidencia SealCards, live-slot placeholder. E2: callout-legal, bighero, riskrow.

### Centro de supervisión
Banner HITL + cola aprobaciones ordenada por riesgo. Cualquier botón resuelve fila y decrementa contador global.

---

## Sidebar forge (toque mínimo)

`forge-global-sidebar-nav.ts`: entrada Nauta actualizada con "Piso de operaciones" y atajo "Nómina y planes" → `/nauta?mode=planes`.

---

## Próximo paso (César / GR-11)

Revisión visual lado a lado con `nauta_portal_v2.html` @ 1440px. Push y merge manual. Si diff > ~500 LOC lógicas, dividir en `v2-core` + `v2-views` (GR-12).
