# FASE 4 — Overlap: diseño Forge preview ↔ componentes actuales

**Fecha:** 2026-05-09  
**Inputs:** `02_FEATURE_ENDPOINT_MAPPING.md`, `03_COMPONENT_INVENTORY.md`, JSX en `forge-design-preview/forge/`.

---

## 4.1 REUSE — UI actual alineada con el nuevo diseño (poca o ninguna pieza nueva)

| Diseño (preview) | Componente / hook actual | Confianza |
|------------------|--------------------------|-----------|
| KPI cards + sparklines | `KpiCard.tsx` + `MicroChart.tsx` | Alta |
| Tabla bandeja / queue | `DataTable.tsx` + `useBankQueue` | Alta |
| Cmd+K | `CommandPalette.tsx` + `ForgeCreditHubCommandPalette.tsx` + context | Alta |
| Sidebar 18 ítems + grupos | `ForgeCreditHubSidebar.tsx` + `CreditHubLayoutClient` | Alta |
| Shell multi-tenant / errores branding | `ForgeCreditHubAppShell.tsx`, `TenantBrandingErrorBanner`, `useTenantBranding` | Alta |
| Evidence stack (estructura) | `EvidenceCard.tsx` | Media — datos mock más ricos en `.jsx` |
| Timeline auditoría | `AuditTimeline.tsx` | Media — agregación portfolio **AMBIGUOUS** en API |
| Detalle solicitud banco | `BankApplicationDetailView.tsx` | Alta funcional; gap de datos Agent/LLM |
| Top dealers chart | Hooks analytics + UI charts en páginas bank | Media — validar shape |
| Tema / chrome | Tokens `lib/credit-hub/design/*` + CSS app | Media — migración V2 pendiente |

---

## 4.2 REFACTOR — Paridad visual Forge V2 sin reescribir desde cero

| Área | Qué tocar | Motivo |
|------|-----------|--------|
| Tokens / color | `tokens.css` / `design/tokens.ts` / CSS variables Forge | Preview “Navy Inverso Light” vs tema actual |
| `EvidenceCard` | Slots: chart inline, fuentes, badge agente, confidence meter | Preview muestra más metadatos que props actuales |
| `KpiCard` / `MicroChart` | Series 7d obligatorias para sparklines | Backend puede no mandar series → PARTIAL |
| `DataTable` | Columnas DTI/LTV/SLA y densidad “bank-dashboard” | Ajuste columnas + tipos `BankQueueItem` |
| `ForgeCreditHubSidebar` | Orden exacto 18 rutas + badges | Ya existe estructura; copy/rutas |
| Páginas `app/(forge)/credit-hub/bank/*` | Componer widgets nuevos (heatmap, funnel) cuando existan datos | Layout reuse |

---

## 4.3 NEW BUILD — Piezas que el preview asume y **no** están como componente dedicado

| Pieza preview | Estado | Dep backend |
|---------------|--------|-------------|
| **Brief ejecutivo LLM** (cards narrativas portfolio) | No hay widget dedicado | **LLM + endpoint agregado** |
| **AML alerts** strip/list | Lista mock en JSX | Endpoint AML o reuse fraud |
| **Funnel** embudo | Sin chart dedicado en Forge | Agregación funnel |
| **Heatmap** hora × día | Sin componente | Serie temporal agregada |
| **Geo provincias RD** | Strip horizontal mock | Geo field + endpoint |
| **Scatter DTI vs LTV** | Podría calcularse client-side | Opcional endpoint |
| **Admin control plane** (MRR, tenant rows, health matrix) | No hay mirror completo en `components/forge` para admin Mercury | Billing + observabilidad |
| **Donut roles RBAC** (admin) | Sin chart RBAC | Telemetría / admin API |

---

## 4.4 DEPRECATE — Candidatos a consolidar (no borrar sin QA)

| Candidato | Riesgo | Recomendación |
|-----------|--------|----------------|
| `layout/Sidebar.tsx` + `Topbar.tsx` vs `ForgeCreditHub*` / `ForgeApp*` | Duplicación patrón nav | Tras V2: unificar en una familia **Sidebar v2** / **Topbar v2** con variantes |
| `ForgeAppShell` vs `ForgeCreditHubAppShell` | Dos shells activos (Legal vs Credit) | Mantener hasta migración Legal; marcar **legacy** en código cuando P11 toque Legal |
| Imports dispersos `@/components/forge/ui/X` vs barrel | Estilo mixto | Normalizar a barrel donde sea seguro |

---

## Resultado FASE 4

**FASE 4 COMPLETA — Reuse: 10+, Refactor: 6 focos, New build: 8 piezas mayores, Deprecate: 3 candidatos** (consolidación incremental, no deletes inmediatos).

**Archivo:** `_design_p11_audit/04_OVERLAP_ANALYSIS.md`
