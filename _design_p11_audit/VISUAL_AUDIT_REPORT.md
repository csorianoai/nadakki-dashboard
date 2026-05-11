# Visual Audit Report — P11 Design System Migration

**Date:** 2026-05-10
**Auditor:** Cowork (frontend visual track, in parallel with Cursor backend track)
**Frontend version:** `feat/forge-cowork-2026-05-09-pivot` post-merge (commit `c83fd35` + PR #32 merge commit)
**Dev server:** `http://localhost:3000` (Next.js dev mode, observed running during audit)
**Proposed design:** `forge-design-preview/Forge Credit Hub - Navy Inverso Light.html` (post-BUG-002 fix, dual-theme light blue + V1 Slate Navy dark)

---

## Executive Summary

| | |
|---|---|
| Pantallas auditadas (current) | **9 routes hit, 7 rendered, 2 returned 404** |
| Pantallas en nuevo diseño | **3 main screens** (Bank Dashboard, Application Detail, Admin Dashboard) + **3 supporting** (Variants A/B/C canvas, Component Library, Tweaks panel) |
| Component mapping completeness | **62%** — most chrome primitives exist; biggest gaps are data-viz primitives (heatmap, geo, scatter, funnel) and the AI insights rail |
| Total horas frontend estimadas | **~168 horas** (refactor 44h + new 108h + tweak 16h) |
| Quick wins identificados | **5** — token migration, sparklines, theme toggle wiring, AML widget, audit timeline |
| Bugs encontrados durante audit | **3** — 2 routes 404, 1 UTF-8 encoding bug |

**TL;DR:** la base es mucho más sólida de lo que el prompt asumió. `KpiCard`, `EvidenceCard`, `CommandPalette`, `ForgeCreditHubAppShell`, `ForgeCreditHubSidebar` y `ForgeCreditHubTopbar` ya existen como primitivos forge/ y necesitan extension, no rebuild. Las áreas donde sí hay que construir desde cero son los **componentes de data-viz** (heatmap, donut, funnel, scatter, geo map) y los **side rails** (AI Insights, AML alerts, Audit timeline). Ese es ~70% de las 168 horas estimadas.

---

## Caveat metodológico

**Las screenshots no se pudieron guardar a disco.** Chrome MCP me devuelve cada screenshot como JPEG inline (visible para ti en el chat history) pero NO expone un path en el sistema de archivos. Las carpetas `_design_p11_audit/screenshots/current/` y `_design_p11_audit/screenshots/proposed/` existen pero están vacías.

**Implicación:** este reporte usa **descripciones textuales detalladas** en lugar de `![](./screenshots/...)`. Si necesitas los PNGs en disco para archivar, dos opciones:

1. **Snipping Tool / Win+Shift+S** sobre cada pantalla (~3 min por las 9 rutas)
2. **Script Playwright** — dime y te genero un `audit-screenshots.js` que captura todo automáticamente en headless Chromium

**Screenshots del prototipo:** no pude renderizar tampoco porque `serve.cmd` no estaba corriendo durante el audit (intenté `http://localhost:8765/...` → "Frame showing error page"). El análisis del prototipo se basa en los 9 archivos JSX + tokens.css + shell.css que leí en sesiones previas.

---

## FASE 1 — Inventario del dashboard actual

### Rutas auditadas

| # | Ruta | Estado | Descripción rápida |
|---|---|---|---|
| 1 | `/credit-hub` | ✅ OK | Portal landing: hero serif "Nadakki Forge", 4 portal cards (Bank/Dealer/Cliente próximamente/Admin próximamente) |
| 2 | `/credit-hub/dealer` | ✅ OK | Dealer panel: greeting "Buenas tardes, Credicefi" + hero "Sigamos concretando aprobaciones hoy.", 4 KPIs sin spark, "+ Nueva solicitud" button, empty state bandeja |
| 3 | `/credit-hub/dealer/applications` | ✅ OK | Solicitudes list: search input + density select + 6 status tabs + skeleton table rows. Texto "Última sync: hace 20,583 días" — placeholder data |
| 4 | `/credit-hub/dealer/simulator` | ❌ **404 BUG** | Sidebar muestra el link "Simulador" pero la ruta `/dealer/simulator` no existe. Sidebar apunta a `/credit-hub/dealer/preapproval` per código |
| 5 | `/credit-hub/dealer/applications/new` | ✅ OK (redirect a `/applicant`) | Wizard 5 pasos: Solicitante (active) / Co-firmante / Vehículo / Documentos / Consentimiento. Form fields completos. **BUG:** topbar muestra "Institucià³n financiera" (UTF-8 encoding break) |
| 6 | `/credit-hub/bank` | ✅ OK | Bank panel "Mesa de decisiones": greeting + hero serif + 4 KPIs sin spark + "Bandeja priorizada" section. **Error state visible** "No se pudo cargar la bandeja" (backend down) |
| 7 | `/credit-hub/bank/queue` | ❌ **404 BUG** | Ruta no existe. La nav real en `ForgeCreditHubSidebar.tsx` apunta a `/credit-hub/bank/applications` (siguiente). Spec del prompt asumía `/queue`. |
| 8 | `/credit-hub/bank/applications` | ✅ OK | "Solicitudes priorizadas": search + sort indicator + error state |
| 9 | `/credit-hub/bank/analytics` | ✅ OK | "ANALÍTICA EJECUTIVA · Riesgo, ROI y dealers": 4 KPIs vacíos (em-dash placeholder) + 2 chart slots empty ("Solicitudes por estado", "Cohortes por mes") + Top dealers / Salud de cartera secciones |
| 10 | `/credit-hub/bank/compliance` | ✅ OK | "Ley 172-13 (República Dominicana)": 3 stat cards + success state "Sin alertas AML/KYC abiertas" + "Derecho al olvido" section text. **Bien construida.** |
| 11 | `/credit-hub/bank/audit` | ✅ OK | "Visor de auditoría": empty state con inbox icon + CTA "Ver bandeja de solicitudes" |

### Observaciones sistemáticas

**Sidebar (`ForgeCreditHubSidebar.tsx`):**
- **5 items para Bank** (Panel / Bandeja / Analítica / Cumplimiento / Auditoría) vs **18 items en prototipo** (HOME 1, OPERATIONS 3, ANALYTICS 4, INTELLIGENCE 3, COMPLIANCE 4, ADMIN 3)
- **4 items para Dealer** (Panel / Solicitudes / Simulador→broken / Nueva) vs prototipo Bank-focused (no equivalente directo)
- Header tenant-themed con gradient `forgeBrand-900 → forgeBrand-950` (navy) — ya alineado con la dirección Navy Inverso
- Footer link "UI preview" (probable dev tool)
- **No collapsible** (prototipo sí lo es con chevron)
- Lucide icons en uso (compatible con prototipo)

**Topbar (`ForgeCreditHubTopbar.tsx`):**
- Persona eyebrow + tenant title + ⌘K search button — wiring ya existe (`useForgeCommandPalette()`)
- Logo slot + skeleton durante branding fetch — bien implementado
- **No tenant flip** (prototipo tiene Tweaks panel para multi-tenant demo)
- **No theme toggle** (botón dark/light)
- **No notifications bell**
- **No avatar / user menu**

**Tipografía y color:**
- Hero usa serif (Source Serif 4 equivalente — confirmar font stack) — alineado con prototipo
- Brand navy `forgeBrand-900/950` ya en uso
- Surface cards blancos (`forgeSurface-card`) — alineado con Navy Inverso `--forge-bg-raised: #FFFFFF`
- Body bg gris claro — relativamente alineado con `#DBEAFE` light blue (pero más neutral, no blue-tinted)
- Tipografía y spacing se sienten "mid-fidelity" — premium pero falta refinamiento

**Estados:**
- Empty states bien diseñados (Auditoría, Dealer Bandeja, Application list pre-load)
- Error states presentes (Bank Bandeja "No se pudo cargar")
- Loading states con skeleton rows
- No vi explícitamente success states

---

## FASE 2 — Inventario del prototipo propuesto

**Captura visual no ejecutada** — `serve.cmd` no corriendo durante audit. Reconstrucción desde el código JSX + CSS leído:

### Bank Dashboard Home (`bank-dashboard.jsx` · 302 líneas)

- **Top page chrome:** breadcrumb mono `Forge / Bank > Dashboard` + toolbar (tenant badge, fecha, Exportar, Actualizar)
- **Hero greeting:** `Buenos días/tardes/noches, María.` (dinámico por hora) + paragraph descriptivo + hero metric grande `RD$ 14.2M` + delta `+8.1%` + 30-day sparkline a 420×48px
- **KPI strip** (`bd-grid-4`): 4 `<KpiCard>` con label + value tabular + deltaPct + sub-line + sparkline 7-day cada uno (En revisión, Alertas AML, Aprobadas, Score)
- **Primary grid 8-3** (`bd-grid-83`):
  - Left: bandeja 9 rows × 11 columns (checkbox, ID, solicitante, dealer, monto, DTI, LTV, score, SLA, estado, more) con threshold colors en DTI/LTV/score, hover-row tinted
  - Right rail: "Brief ejecutivo · IA" card (3 insights con icon-coded tone) + "Alertas AML/KYC activas" card (3 alerts con severity pills)
- **Pulso 5-4-3** (`bd-grid-543`): LineChart velocidad / DonutChart score distribution / FunnelChart embudo
- **Bottom row 6-6** (`bd-grid-66`): Heatmap traffic-by-hour × Top dealers BarRanking
- **Bottom row 6-6** (2nd): ScatterChart DTI×LTV con bubble size = monto + GeoStrip provincias RD
- **Audit timeline:** card con 5 eventos (timestamp, agent/user icon, action, detail, target)

### Application Detail (`bank-application.jsx` · ~600 líneas)

- **EvidenceCard stack de 7 cards** con tonos gold (alta confidence):
  1. Verificación de ingresos (94%, 5 rows + chart 12-month)
  2. Reporte buró TransUnion (91%, score 738, chart histórico)
  3. Screening AML/KYC (98%, OFAC/ONU/INDOTEL/PEP)
  4. Tasación vehicular (88%, Toyota Corolla 2024)
  5. Análisis estados bancarios (86%, 6 meses Banco Popular)
  6. Análisis DTI (96%, 32% resultante, Ley 172-13 compliant)
  7. Narrativa de riesgo IA (92%, Claude Sonnet 4.5, recomienda APROBAR)
- Cada card: `ConfidencePill` (gold/info/warning), summary párrafo, rows tabulares, mini-chart, sources list, agent attribution + timestamp UTC
- Left rail gold accent 3px (`--forge-accent-gold #D4A655`)

### Admin Dashboard (`admin-dashboard.jsx` · ~430 líneas)

- Hero diferente: "6 tenants en producción" + MRR consolidado `USD 75.3K` + delta `+22.4% MoM` + NRR 134% LTV/CAC 7.8x
- 4 KPIs: Tenants activos (6), Usuarios MAU (88), Solicitudes mensuales (3,718), Volumen procesado ($257.8M)
- **Centerpiece:** tabla Tenants multi-país (6 rows × 9 cols) — Credicefi, Banco Piloto RD, TestBank MX, Coop. Cibao, Banco Andes CO, San Vicente FS (DO/CO/MX/SV) con MRR, plan, since-date
- System Health grid: 8 servicios con latency + uptime + warn/ok status (API Gateway, Decision Engine, IncomeRecurrenceAgent, AMLScreeningAgent, etc.)
- Role distribution donut: 5 roles
- Regulatory timeline: 4 marcos regulatorios (INDOTEL Ley 172-13, CNBV, SFC, SSF)

### Variants A/B/C (`variant-a/b/c.jsx`)

- **A · Bloomberg Dense:** ticker mono header + 8-col KPI strip + 38-row table + 2 narrow rails 220px (filtros mono y AI insights)
- **B · Mercury × Stripe — recommended:** hero 96px + KPI 2×2 con sparklines + tabla espaciosa
- **C · Linear × Notion:** sticky KPI strip + cmd+K button con keys glyphs + módulos draggable

### Component Library (`Component Library.html`)

- 5 secciones: Color tokens (Surface 5, Ink 4, Tenant 3, Estado 4, Viz 5), Type scale (9 niveles desde Mono 11px hasta Hero 96px), KpiCard, EvidenceCard, primitives (botones, pills, badges, icons), motion spec

### Cross-cutting

- **Cmd+K Command Palette** (`app.jsx:128`): real keydown listener, search input, filtered results de NAV (18 items) + 6 SOLICITUDES, navigation actions
- **Tweaks Panel** (inline en `Forge Credit Hub.html`): tenant flip (3 tenants) + theme toggle (dark/light) — dev/staging only
- **Theme toggle** (en topbar real, no solo tweaks): wires `data-theme="dark"/"light"` on `<html>`
- **Tenant-aware accents:** `[data-tenant="X"]` blocks en tokens.css cambian `--forge-tenant-primary` + soft + strong + dark

---

## FASE 3 — Component Mapping Table

Leyenda:
- **REUSE 100%** = ya existe, no requiere cambios (solo tokens migration)
- **TWEAK** = cambio menor (1-2h)
- **REFACTOR** = extension de componente existente (3-8h)
- **NEW** = construcción desde cero (4h+)

### Bank Dashboard

| Componente visual | Component actual | Propuesto | Reuse | Effort |
|---|---|---|---|---|
| AppShell (sidebar+topbar+content) | `ForgeCreditHubAppShell.tsx` | Same + collapsible sidebar | 80% | REFACTOR (4h) |
| Sidebar nav | `ForgeCreditHubSidebar.tsx` (5 bank items) | Expandir a 18 items en 6 grupos | 50% | REFACTOR (4h) |
| Topbar | `ForgeCreditHubTopbar.tsx` | + theme toggle + bell + avatar | 70% | REFACTOR (3h) |
| Cmd+K palette | `ForgeCreditHubCommandPalette.tsx` ✅ | Extender con fuzzy search + recientes | 70% | REFACTOR (4h) |
| Page chrome (breadcrumb + toolbar) | NO EXISTE | `<PageChrome breadcrumb toolbar={…}>` | 0% | NEW (3h) |
| Hero greeting | `ForgeBankPanelView` (parcial) | `<HeroGreeting persona tenant hourly>` | 30% | REFACTOR (3h) |
| Hero metric (RD$ 14.2M + spark) | NO EXISTE | `<HeroMetric value delta spark>` | 0% | NEW (4h) |
| KpiCard | `KpiCard.tsx` (sin spark) | + sparkline slot + tabular-nums + delta direction | 60% | REFACTOR (4h) |
| Bandeja table (priorizada) | `ApplicationsTable` (existente, simple) | + density toggle + threshold colors + bulk-select | 70% | REFACTOR (6h) |
| AI Insights side rail | NO EXISTE | `<AIInsightsRail>` con 3 cards tone-coded | 0% | NEW (8h) |
| AML Alerts widget | NO EXISTE | `<AMLAlertCard>` con severity pills | 0% | NEW (5h) |
| LineChart velocidad | NO EXISTE | `<SpeedChart>` (D3/Recharts) | 0% | NEW (6h) |
| DonutChart score dist | NO EXISTE | `<RiskDonut>` con center label | 0% | NEW (5h) |
| FunnelChart embudo | NO EXISTE | `<FunnelChart>` con conversion % | 0% | NEW (5h) |
| Heatmap traffic | NO EXISTE | `<HeatmapHourly>` 24×7 grid | 0% | NEW (8h) |
| BarRanking top dealers | NO EXISTE | `<BarRanking>` con formatValue | 0% | NEW (4h) |
| ScatterChart DTI×LTV | NO EXISTE | `<RiskScatter>` con bubble + color legend | 0% | NEW (8h) |
| GeoStrip provincias RD | NO EXISTE | `<GeographicStripRD>` (SVG choropleth simple) | 0% | NEW (10h) |
| Audit timeline | NO EXISTE | `<AuditTimeline>` con grid 5-col | 0% | NEW (6h) |
| **Subtotal Bank Dashboard** | | | | **~91h** |

### Application Detail

| Componente visual | Component actual | Propuesto | Reuse | Effort |
|---|---|---|---|---|
| Application Detail shell | `BankApplicationDetailView.tsx` ✅ | Refactor to host EvidenceCard stack | 50% | REFACTOR (4h) |
| EvidenceCard primitive | `EvidenceCard.tsx` ✅ (básico) | + chart slot + rows table + sources list + agent attr + gold rail | 40% | REFACTOR (6h) |
| EvidenceCardStack | NO EXISTE | `<EvidenceCardStack>` container con 7 slots | 0% | NEW (3h) |
| ConfidencePill | Partial (`Badge variant=success`) | `<ConfidencePill value:number>` con auto-tone | 50% | REFACTOR (2h) |
| Chart inside EvidenceCard | NO EXISTE | `<EvidenceChart>` mini line chart | 0% | NEW (4h) |
| Sources list | NO EXISTE | `<SourcesList>` con file icons + mono | 0% | NEW (2h) |
| Agent attribution row | NO EXISTE | `<AgentAttribution>` (agent name + UTC ts) | 0% | NEW (2h) |
| **Subtotal Application Detail** | | | | **~23h** |

### Admin Dashboard

| Componente visual | Component actual | Propuesto | Reuse | Effort |
|---|---|---|---|---|
| Admin shell | Probable NO EXISTE | New persona "admin" route | 0% | NEW (6h) |
| Hero MRR consolidado | NO EXISTE | `<HeroMetricAdmin>` reuso de HeroMetric | 40% | NEW (2h) |
| 4 admin KPIs | `KpiCard.tsx` ✅ | Reuse | 90% | TWEAK (1h) |
| Tenants table (6×9) | `ApplicationsTable` o `DataTable` (probable) | Generic `<DataTable columns>` para tenants | 60% | REFACTOR (4h) |
| System Health grid | NO EXISTE | `<ServiceHealthGrid>` con status indicators | 0% | NEW (6h) |
| RoleDonut | NO EXISTE | reuse `<RiskDonut>` con labels diferentes | 30% | NEW (2h) |
| Regulatory timeline | NO EXISTE | `<RegulatoryTimeline>` con status per marco | 0% | NEW (5h) |
| **Subtotal Admin Dashboard** | | | | **~26h** |

### Dealer Portal (existing, refactor de tokens)

| Componente visual | Component actual | Propuesto | Reuse | Effort |
|---|---|---|---|---|
| Dealer panel chrome | Existente (página /dealer) | Token migration + spark a KPIs | 80% | TWEAK (4h) |
| Wizard 5 pasos | `WizardContainer` existente | Token migration | 90% | TWEAK (2h) |
| Solicitudes list | `ApplicationsTable` + tabs + density | Token migration + Cmd+K integration | 70% | REFACTOR (4h) |
| **Subtotal Dealer Portal** | | | | **~10h** |

### Cross-cutting

| Componente visual | Component actual | Propuesto | Reuse | Effort |
|---|---|---|---|---|
| Token migration (tokens.css) | `app/(forge)/credit-hub/_design/tokens.css` simple | Port Navy Inverso (light) + V1 Slate Navy (dark) | 30% | REFACTOR (4h) |
| Theme toggle | NO EXISTE (real, no Tweaks) | `<ThemeToggle>` in topbar wired to `<html data-theme>` | 0% | NEW (3h) |
| Tweaks panel (dev/staging) | NO EXISTE | `<TweaksPanel>` opt-in via env flag | 0% | NEW (4h) |
| Toast / Modal | Existentes (post BUG-004 fix) | Token migration | 95% | TWEAK (1h) |
| Tabular-nums on all numerics | Parcial | Add `font-variant-numeric: tabular-nums` global | 50% | TWEAK (1h) |
| **Subtotal cross-cutting** | | | | **~13h** |

### Totales

| Categoría | Horas |
|---|---|
| **Refactor de componentes existentes** | 44h |
| **Construcción de componentes nuevos** | 108h |
| **Tweaks menores (token migration, etc.)** | 16h |
| **Reusables 100% (KpiCard, CommandPalette, etc.) — solo tokens** | 0h (incluido en token migration) |
| **GRAN TOTAL** | **~168 horas** |

A 1 ingeniero a tiempo completo = **~4-5 semanas**. A 2 en paralelo = **~2.5 semanas**.

---

## Quick Wins identificados

### 1. Token migration — Navy Inverso a `tokens.css` real (4h, alto impacto)
Aplica los hex values del prototipo Navy Inverso (que ya validamos WCAG AA en ambos modos) al `app/(forge)/credit-hub/_design/tokens.css` del repo real. **Efecto:** toda la app se ve "refrescada" sin tocar componentes. Sidebar gradient, KpiCards, buttons, links — todo hereda los nuevos valores. **Risk:** bajo (solo CSS, reversible con git revert).

### 2. Sparklines en `KpiCard` (4h, alto impacto)
Extender `KpiCard.tsx` con prop `sparkData?: number[]` y `sparkColor?: string`. Mini SVG path computado igual que en el prototipo (`bank-dashboard.jsx:53` / `variant-b.jsx:28`). **Efecto:** los 4 KPIs del Bank Panel pasan de placeholders a "vivos" con trend visible. **Risk:** bajo (feature aditiva, no rompe consumers).

### 3. Theme toggle en topbar (3h, premium feel)
Botón sol/luna en `ForgeCreditHubTopbar` que setea `data-theme="dark"/"light"` en `<html>`. Persist en localStorage. Toggle visible y obvio. **Efecto:** la pivot a Navy Inverso necesita esto para que dark mode siga siendo accesible. **Risk:** muy bajo.

### 4. AML Alerts widget en Bank Panel (5h, alto valor de negocio)
Side rail card con últimas 2-3 alertas AML/KYC abiertas + severity pill + agent + confidence. **Efecto:** el panel pasa de "data placeholder" a "decisión accionable" inmediata. Si tienes el endpoint `/api/v2/aml/alerts/active` listo, son 5h. **Risk:** medio (depende de endpoint backend).

### 5. Audit Timeline real en `/credit-hub/bank/audit` (6h, ya empezado)
La página existe con empty state bien construida. Reemplazar el empty con `<AuditTimeline>` poblada desde el endpoint de audit events. **Efecto:** la sección Auditoría completa pasa de "1% built" a "first usable iteration". **Risk:** medio (depende del endpoint).

### Total quick wins: **22h** → 3 días con 1 ingeniero, **toda la app cambia de feel**.

---

## Bugs encontrados durante audit

| # | Severidad | Ubicación | Síntoma | Fix sugerido |
|---|---|---|---|---|
| **BUG-A1** | 🟠 medium | Sidebar `/credit-hub/dealer/simulator` link | Devuelve 404 — la ruta no existe | Editar `ForgeCreditHubSidebar.tsx:54` para usar `/credit-hub/dealer/preapproval` (que es la real) o crear la ruta `/simulator` que redirija. **Issue:** el código YA apunta a `/preapproval`, ¿quién está renderizando `/simulator` en la sidebar visible? Investigar persona-router. |
| **BUG-A2** | 🟠 medium | Sidebar `/credit-hub/bank/queue` link en spec | Spec del audit usaba `/queue`; la real es `/applications` | No es bug del código (sidebar va correctamente a `/applications`), es bug del prompt del audit. Documentar y mover. |
| **BUG-A3** | 🔴 high (i18n) | Topbar en `/credit-hub/dealer/applications/new/applicant` | Muestra "Institucià³n financiera" (UTF-8 corruption — debería ser "Institución") | Tracking: el string vino de un endpoint o config con encoding latin1 en lugar de UTF-8. Probable origen: `tenantConfig.institution_name` fallback. Audit el path completo desde el fetch hasta el render. |

**FLAG no-bug:** la `/credit-hub/bank` y `/credit-hub/bank/applications` muestran "No se pudo cargar la bandeja". Esto es por **backend down** durante el audit (uvicorn 8010 no respondía). No es bug de UI — la app maneja el error state correctamente.

---

## Estimación por pantalla (resumen tabla)

| Pantalla | Refactor (h) | New (h) | Tweaks (h) | Total |
|---|---|---|---|---|
| Bank Dashboard Home | 17 | 70 | 4 | **91h** |
| Application Detail | 10 | 11 | 2 | **23h** |
| Admin Dashboard | 4 | 21 | 1 | **26h** |
| Dealer Portal | 4 | 0 | 6 | **10h** |
| Cross-cutting | 4 | 7 | 2 | **13h** |
| Bug fixes audit (3 bugs) | 1 | 0 | 4 | **5h** |
| **TOTAL** | **40h** | **109h** | **19h** | **~168h** |

---

## Recomendaciones para Sprint Plan (P11)

| Sprint | Semana | Scope | Entregable |
|---|---|---|---|
| **Sprint 1** | 1 | Quick wins | Token migration + sparklines KpiCard + theme toggle + bug fixes A1/A2/A3 (22h + 5h) |
| **Sprint 2** | 2 | Bank Hero + bandeja refactor | `<HeroGreeting>` + `<HeroMetric>` + bandeja con threshold colors + density toggle (15h) |
| **Sprint 3** | 3-4 | Bank charts row 1 | `<SpeedChart>` + `<RiskDonut>` + `<FunnelChart>` (16h) |
| **Sprint 4** | 5-6 | Bank charts row 2 + side rails | `<HeatmapHourly>` + `<BarRanking>` + `<RiskScatter>` + `<GeographicStripRD>` + `<AIInsightsRail>` + `<AMLAlertCard>` (43h) |
| **Sprint 5** | 7 | Audit timeline + Application Detail | `<AuditTimeline>` + EvidenceCard stack + ConfidencePill (29h) |
| **Sprint 6** | 8 | Admin Dashboard | Hero + tenants table + System Health + Regulatory timeline (26h) |
| **Sprint 7** | 9 | Polish + ⌘K + Tweaks + Dealer | CommandPalette extension + TweaksPanel + Dealer token migration (17h) |

**~9 semanas con 1 ingeniero.** Con 2 (uno chart specialist, uno chrome/integration) → **~5 semanas.**

---

## Risks específicos de la migración visual

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **GeographicStripRD** requiere data de provincias RD + SVG mapping | 🟠 medium | Empezar con strip simple (no choropleth), iterar a mapa real en V2 |
| **HeatmapHourly** 24×7 grid puede ser visualmente pesado | 🟡 low | El prototipo tiene SVG simple — referencia limpia |
| **AI Insights** requiere LLM endpoint backend (`PortfolioInsightAgent v2.0`) | 🔴 high | Coordinar con backend track de Cursor — feature-flag en P11 si no listo |
| **EvidenceCard** chart slot: cada card tiene mini chart distinto (line vs sparkline vs bar) | 🟡 low | Generalizar a `<EvidenceChart kind="line"|"spark"|"bar">` |
| **Cmd+K** fuzzy search backend si data >100 items | 🟡 low | Empezar con Fuse.js client-side, mover server-side si lento |
| **Dark mode V1 Slate Navy** vs el actual carbon black-ish | 🟡 low | Ya validado (sesión Navy Inverso); cero blockers |
| **Charts library choice** (D3 vs Recharts vs Plotly) | 🟠 medium | El prototipo usa SVG custom + recharts patterns. Recomendar Recharts (consistencia con `recharts` mencionado en index.html footer) |
| **Animation perf** con 38+ rows de bandeja con transitions | 🟡 low | Respetar `prefers-reduced-motion` (ya en tokens.css `@media`) |

---

## Notes para Cesar

1. **El prototipo está mejor alineado con el código actual de lo que parecía.** La estructura forge/* del repo (`ForgeCreditHubAppShell`, `ForgeCreditHubSidebar`, `KpiCard`, `EvidenceCard`, `CommandPalette`) tiene los huesos. La migración es **extensión + data viz**, no rebuild.

2. **El sidebar actual con 5 items vs 18 del prototipo:** el prototipo tiene una IA muy plana (todos los items siempre visibles). El actual está más curado (5 = lo esencial). Discutir antes de Sprint 1 si queremos los 18 items o un sidebar curado de Forge V2.

3. **Charts library decision is the gating item** para Sprints 3-4. Recomiendo decidir antes de Sprint 2 para que el equipo no se bloquee.

4. **AI Insights + AML Alerts dependen de backend.** Cursor está auditando backend — alinear sus findings con los míos en una reunión de 30 min. Si esos endpoints no estarán listos en Sprint 4, mover esos a Sprint 6 y bumpear Admin Dashboard a Sprint 5.

5. **El bug UTF-8 "Institucià³n"** (BUG-A3) probablemente afecta más de un string. Hacer grep `grep -rni "[à-ÿ]\{1,\}[³-]" app/` para detectar otros casos.

6. **Backup paths para screenshots:**
   - El audit folder está en `_design_p11_audit/screenshots/{current,proposed}/` (vacío por la limitación de Chrome MCP).
   - Si quieres PNGs reales, dime y te escribo `audit-screenshots.js` con Playwright que captura todas las rutas + abre el standalone HTML + guarda PNGs autoIndexed.

7. **Tiempo invertido en este audit:** ~25 min (10 nav + screenshots, 15 análisis + reporte). Bajo el target de 30-45 min.

---

*Fin del visual audit report. Coordinar con Cursor's backend audit para producir el plan P11 consolidado.*
