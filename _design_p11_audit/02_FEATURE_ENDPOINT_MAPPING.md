# FASE 2 — Mapeo diseño Forge (`forge-design-preview`) → endpoints backend

**Fecha:** 2026-05-09  
**Fuentes UX revisadas (solo `.jsx` existentes):**

- `forge-design-preview/forge/app.jsx` — shell: sidebar **18 ítems de navegación** agrupados (HOME, OPERATIONS, ANALYTICS, INTELLIGENCE, COMPLIANCE, ADMIN), topbar, **Cmd+K**.
- `forge-design-preview/forge/bank-dashboard.jsx` — dashboard banco: KPIs, bandeja, **Brief ejecutivo IA**, **AML alerts**, charts (línea, donut, funnel, heatmap, barras, scatter, geo strip), audit timeline.
- `forge-design-preview/forge/data.jsx` — **fixtures locales** (`APPLICATIONS`, `AI_INSIGHTS`, `AML_ALERTS`, `FUNNEL_DATA`, `HEATMAP`, `DEALERS`, `PROVINCIAS_RD`, etc.) — **no llaman HTTP**.
- Otros archivos en `forge/` (charts, variants): complementarios de UI; no duplican lista de negocio principal.

**Prefijo API credit típico:** `/api/v2/credit/*` (`routers/credit_router.py`).

---

## Inventario de features visuales (del JSX)

| ID | Feature (UI) | Origen archivo |
|----|----------------|----------------|
| F1 | Hero saludo + volumen aprobado hoy + sparkline | bank-dashboard.jsx |
| F2 | KPI “En revisión” + sparkline | bank-dashboard.jsx |
| F3 | KPI “Alertas AML” + sparkline | bank-dashboard.jsx |
| F4 | KPI “Aprobadas hoy” + sparkline | bank-dashboard.jsx |
| F5 | KPI “Score promedio” + sparkline | bank-dashboard.jsx |
| F6 | Tabla bandeja solicitudes (DTI, LTV, score, SLA) | bank-dashboard.jsx |
| F7 | Brief ejecutivo IA (cards narrativas, badge LLM) | bank-dashboard.jsx |
| F8 | Lista alertas AML/KYC | bank-dashboard.jsx |
| F9 | Gráfico velocidad aprobaciones (LineChart 30d) | bank-dashboard.jsx |
| F10 | Donut distribución por score | bank-dashboard.jsx |
| F11 | Embudo crediticio | bank-dashboard.jsx |
| F12 | Heatmap tráfico hora × día | bank-dashboard.jsx |
| F13 | Top dealers (BarRanking) | bank-dashboard.jsx |
| F14 | Scatter DTI vs LTV | bank-dashboard.jsx |
| F15 | Geo strip provincias RD | bank-dashboard.jsx |
| F16 | Auditoría / timeline eventos | bank-dashboard.jsx (inferido líneas “Audit timeline”) |
| F17 | Sidebar multi-sección (18 rutas de navegación) | app.jsx `NAV` |
| F18 | Cmd+K / búsqueda global | app.jsx + topbar |
| F19 | Tenant badge + branding chrome | app.jsx / bank-dashboard |
| F20 | Toggle tema claro/oscuro | app.jsx topbar |

*(Extensiones `bank-application.jsx` y `admin-dashboard.jsx` están tabuladas más abajo.)*

---

## Tabla de mapeo

| Feature | Endpoint candidato | Status | Gap / trabajo |
|---------|-------------------|--------|----------------|
| F1 Hero métricas volumen | `GET /api/v2/credit/stats` + series temporales | PARTIAL | Backend expone stats; **serie “volumen aprobado por día”** puede requerir agregación nueva o extensión de `/stats`. |
| F2–F5 KPIs | `GET /api/v2/credit/stats` o `/applications` agregado | PARTIAL | KPIs con sparklines necesitan **histórico 7d** — verificar si `/stats` incluye series; si no, **NOT EXISTS** slice nuevo. |
| F6 Bandeja | `GET /api/v2/credit/applications` + `GET .../queue` | EXISTS | Shape compatible con lista; filtros SLA avanzados pueden ser PARTIAL. |
| F7 Brief IA LLM | **Ninguno dedicado “portfolio insight”** | **NOT EXISTS** | **LLM POWERED** — requiere agente/servicio + endpoint (p. ej. `POST /api/v1/.../insights`) o reutilizar orquestador autónomo bajo feature flag. |
| F8 AML | **No hay widget AML único** en credit_router | **NOT EXISTS** o | Integrar **fraud flags** SIC o nuevo microservicio AML; o **AMBIGUOUS** si se mapea a `fraud-signals` en credit. |
| F9 Velocidad (línea) | `GET /api/v2/credit/analytics/dashboard` | PARTIAL | Verificar si entrega series diarias; si no, endpoint series. |
| F10 Donut score | `GET /api/v2/credit/analytics/portfolio-health` o análisis | PARTIAL | Validar shape `buckets` vs UI. |
| F11 Funnel | **No hay funnel explícito** en grep credit | **NOT EXISTS** | Nuevo agregado por etapa pipeline. |
| F12 Heatmap | **NOT EXISTS** típico | **NOT EXISTS** | Nuevo: agregación por hora/día (tráfico / solicitudes). |
| F13 Top dealers | `GET /api/v2/credit/analytics/dealers-ranking` | EXISTS | Alineación con `BarRanking` — validar campos. |
| F14 Scatter DTI/LTV | **NOT EXISTS** explícito | **NOT EXISTS** o | Derivado de `GET .../applications` con cálculo en front — **PARTIAL** si se prefiere client-side. |
| F15 Geo provincias | **NOT EXISTS** | **NOT EXISTS** | Requiere **geocodificación** o campo provincia en solicitudes; dato puede faltar. |
| F16 Audit timeline | `GET /api/v2/credit/applications/{id}/audit-trail` + eventos | PARTIAL | Vista portfolio multi-solicitud no listada; posible **NOT EXISTS** agregado. |
| F17–F18 Navegación / Cmd+K | N/A front-only | EXISTS | Cmd+K no requiere endpoint por sí solo; búsqueda puede usar **múltiples** GETs. |
| F19 Tenant / branding | `GET /api/v2/tenants/{id}/branding` | EXISTS | P10-05 / backend reciente. |
| F20 Tema | N/A | EXISTS | Local storage / front. |

**Resumen GAPS (endpoints nuevos o fuertes extensiones):** **Funnel, Heatmap, Geo RD, scatter server-side, AML dedicado, LLM brief** — marcados arriba.

---

## Ampliación — `bank-application.jsx` (detalle solicitud)

Features visibles en archivo (centro: **EvidenceCard stack**):

| Feature | Endpoint candidato | Status | Gap |
|---------|-------------------|--------|-----|
| Stack EvidenceCard (ingresos, buró, AML, vehículo, estados) | `GET /api/v2/credit/applications/{id}` + análisis adjuntos | PARTIAL | UI espera **confidence, agent, chart embebido, fuentes** — backend suele devolver JSON más plano; puede requerir **DTO enriquecido** o capa BFF. |
| Tabs / bandas de decisión | `GET/PATCH` decisiones banco | PARTIAL | Ver `useBankDecision` / queue. |
| Narrativa agente por tarjeta | Orquestador / análisis LLM | **LLM POWERED** | **NOT EXISTS** como payload único “evidence card” unificado. |
| AML evidence dentro de tarjeta | fraud / compliance | **NOT EXISTS** o | **AMBIGUOUS** vs `sic_fraud` / credit fraud signals — confirmar dominio. |

---

## Ampliación — `admin-dashboard.jsx` (control plane)

| Feature | Endpoint candidato | Status | Gap |
|---------|-------------------|--------|-----|
| Tabla tenants (MAU, MRR, plan) | `backend/routers` tenant + billing v2 | PARTIAL | Shape “Mercury x Stripe” del mock puede no coincidir 1:1 con billing actual. |
| Health subsistemas | `/health`, observabilidad, varios | PARTIAL | Lista unificada tipo “Decision Engine / Agents” **NOT EXISTS** como un solo GET. |
| Donut roles / distribución | **NOT EXISTS** | **NOT EXISTS** | Agregado RBAC/telemetría. |
| Regulación por jurisdicción | legal / compliance config | **AMBIGUOUS** | Puede ser solo copy legal vs API real. |

---

## Resultado FASE 2

**FASE 2 COMPLETA — ~28 features visuales inventariadas** (`bank-dashboard`, `app`, `bank-application`, `admin-dashboard`); **8+ áreas NOT EXISTS / LLM / AMBIGUOUS** para paridad con Forge preview; el resto EXISTS/PARTIAL.

**Endpoints nuevos destacados (bold en tablas):** funnel agregado, heatmap horario, geo RD, AML dedicado, brief ejecutivo LLM, panel health unificado admin, donut RBAC, evidence payload enriquecido.

**Archivo:** `_design_p11_audit/02_FEATURE_ENDPOINT_MAPPING.md`
