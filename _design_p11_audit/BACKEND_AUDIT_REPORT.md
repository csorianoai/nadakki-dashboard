# Backend + Repo Audit Report — P11 Design System Migration

**Date:** 2026-05-09  
**Dashboard branch:** `main` @ `7504a03`  
**Backend branch:** `main` @ `698b500a` (repo `nadakki-ai-suite`)  
**Auditor:** Cursor (Composer-style audit; sin cambios de código productivo)

---

## Executive Summary

| Métrica | Valor |
|---------|--------|
| Total endpoints HTTP montados (FastAPI runtime) | **~640** (ver [01](01_ENDPOINTS_INVENTORY.md); incluye duplicación v1/v2 y OPTIONS) |
| Reuse rate endpoints (Credit Hub / preview vs `/api/v2/credit/*` y relacionados) | **~45–55%** EXISTS/PARTIAL para flujo banco principal — **AMBIGUOUS** sin contrato OpenAPI exportado |
| Endpoints nuevos / extensiones fuertes para paridad Forge preview | **~8 áreas** (funnel, heatmap, geo RD, AML dedicado, brief LLM, health admin unificado, RBAC donut, evidence DTO rico) |
| Componentes Forge catalogados (`components/forge`) | **49** (~5.3k líneas) |
| Componentes reusables hacia V2 (alta confianza) | **~12** primitivas + shells (ver [04](04_OVERLAP_ANALYSIS.md)) |
| Componentes a refactor (tokens + datos) | **~6** focos principales |
| Componentes / widgets nuevos requeridos por preview | **~8** bloques mayores (LLM, AML, charts gap, admin) |
| Tiempo estimado migración end-to-end (front + back acoplado) | **6–10 semanas** con 2 devs front + 1 back — **AMBIGUOUS** según alcance admin/LLM |
| Risk score (1–10) | **6/10** — dependencia fuerte de nuevos agregados y LLM; superficie API grande |

---

## Detailed Findings

| Documento | Contenido |
|-----------|-----------|
| [01_ENDPOINTS_INVENTORY.md](01_ENDPOINTS_INVENTORY.md) | `include_router`, ~640 rutas montadas, dominios credit/consent/branding/SIC/legal |
| [02_FEATURE_ENDPOINT_MAPPING.md](02_FEATURE_ENDPOINT_MAPPING.md) | Features extraídas solo de JSX preview → mapping EXISTS/PARTIAL/**NOT EXISTS**/LLM |
| [03_COMPONENT_INVENTORY.md](03_COMPONENT_INVENTORY.md) | Tabla componentes Forge + hooks/API credit-hub |
| [04_OVERLAP_ANALYSIS.md](04_OVERLAP_ANALYSIS.md) | Reuse / refactor / new build / deprecate |
| [05_DEPENDENCY_GRAPH.md](05_DEPENDENCY_GRAPH.md) | P11-00–10 DAG, critical path, paralelos, bloqueos backend |

---

## Implementation Strategy

### Quick wins (1–2 días)

- Alinear **KPI row** del bank dashboard con datos ya expuestos por `useCreditStats` / `useBankAnalytics` — sin nuevos endpoints si las series ya existen.
- Documentar contrato real vs preview usando **`/openapi.json`** exportado del backend (sin código: solo contrato en equipo).
- **Cmd+K:** pulir acciones en `ForgeCreditHubCommandPalette` sobre rutas existentes.

### Sprint 1 — Foundation (≈1 semana)

| Ticket | Owner sugerido | Acceptance criteria |
|--------|----------------|---------------------|
| P11-00 | Front | Tokens Forge preview aplicados en `:root` / dark; sin regresiones Legal/Credit |
| P11-01 | Front | Story parity en Button, Card, Input, KpiCard, DataTable density |
| P11-02 | Front | ForgeCreditHub shell + sidebar/topbar visualmente alineados al HTML standalone |

### Sprint 2 — Core Credit Hub (≈1 semana)

| Ticket | Criteria |
|--------|----------|
| P11-03 | Bank dashboard: bandeja + KPI + charts existentes sin mocks donde API lista |
| P11-04 | Detalle solicitud: EvidenceCard muestra campos disponibles en API; gaps marcados **AMBIGUOUS** |
| P11-07 | Cmd+K estable en todas rutas `(forge)/credit-hub/*` |

### Sprint 3 — Data-rich + compliance (≈1–2 semanas)

| Ticket | Criteria |
|--------|----------|
| P11-05 | Funnel, heatmap, geo, scatter: **mocks aislados** hasta backend listo; feature flags |
| P11-08 | AML strip: fuente de verdad acordada (credit vs SIC fraud) |

### Sprint 4 — Intelligence + release (≈1–2 semanas)

| Ticket | Criteria |
|--------|----------|
| P11-09 | Brief LLM: endpoint + límites + fallback copy |
| P11-10 | Visual QA, accessibility sweep, preview HTML ↔ app diff |
| P11-06 (opcional) | Admin Mercury solo si producto lo prioriza |

---

## Risks + Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Nuevos agregados (heatmap, funnel, geo) retrasan backend | Demo V2 sin datos reales | Feature flags + mocks acotados + contrato API primero |
| Duplicación API v1/v2 incrementa confusión en mapping | Integración errónea | Documentar “canonical base URL” para dashboard |
| LLM cost / latencia en brief y evidence | UX rota o costo alto | Cache por tenant, degradación a plantillas |
| EvidenceCard requiere payload rico | Front bloqueado | BFF read-model o ampliación DTO incremental |

---

## Backend Work Required

| Endpoint / capability | Est h back | Notas |
|-----------------------|------------|-------|
| Serie temporal volumen / KPI 7d | 8–16 h | Extender `/stats` o nuevo `/metrics/timeseries` |
| Funnel por etapa | 16–24 h | Agregación pipeline |
| Heatmap hora×día | 16–24 h | Depende telemetría solicitudes |
| Geo por provincia RD | 12–20 h | Requiere dato domicilio/normalización |
| AML widget consolidado | 16–32 h | **AMBIGUOUS** dominio vs `sic_fraud_*` |
| Brief ejecutivo LLM | 24–40 h | Orquestador + guardrails |
| Admin health matrix unificado | 16–24 h | Agregar facade sobre health existentes |
| Evidence/bureau structured read-model | 24–40 h | Opción BFF |

*(Horas orientativas para planning; no sustituyen estimación en equipo.)*

---

## Open Questions for Cesar

1. ¿El **AML** del preview vive en **credit core**, en **SIC RouteOne**, o en ambos con prioridad única?  
2. ¿**Admin-dashboard** “Mercury × Stripe” es in-scope para P11 o fase posterior?  
3. ¿Se acepta **scatter DTI/LTV** 100% calculado en cliente desde `/applications`?  
4. ¿Fuente de verdad para **provincia RD** (formulario solicitud vs geocode)?  
5. ¿Presupuesto LLM (proveedor, límites por tenant) para brief + evidence narrative?

---

## Resultado FASE 6

**FASE 6 COMPLETA — Reporte ejecutivo en `_design_p11_audit/BACKEND_AUDIT_REPORT.md`**
