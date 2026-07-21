# 03 · SCREEN → DATA MAP (insumo para el rediseño honesto)

> Cruce de `01_RENDER_TRUTH.md` (componente real) × `02_BACKEND_TRUTH.md` (dato real).
> Para cada pantalla: qué muestra · componente · endpoint · campos REALES disponibles ·
> qué se puede mostrar REAL · qué sería DEMO.

Leyenda: **REAL** = viene de DB. **DEMO** = hardcodeado / sin endpoint. **DERIVADO** = calculado en el front.

---

## DEALER

### 1. Inicio · `/credit-hub/dealer`
- **Componente:** `DealerDashboardView.tsx`
- **Endpoints:** `GET /api/v2/credit/stats` + `GET /api/v2/credit/applications`
- **Campos reales disponibles:** stats(`total_applications`, `states{}`, `avg_score`, `approval_rate`); lista(`applicant_name`, `vehicle_*`, `requested_amount`, `state`, `created_at`).
- **Lo que se PUEDE mostrar REAL:**
  - KPIs honestos derivados de `states{}`: Borrador/Enviadas/En proceso/Aprobadas/Rechazadas/**Completadas**.
  - Pipeline (`PipelineFunnel`) por etapa — REAL.
  - Tarjetas de solicitudes activas con nombre/vehículo/monto — REAL.
  - Score promedio (`avg_score`), tasa de aprobación (`approval_rate`) — REAL.
- **DEMO / a evitar:**
  - `BankRanking` ("¿a quién enviar?") → **DEMO** (`DEMO_BANKS`; `banks-ranking` = 404).
  - `DealerGoals` ("Metas del mes") → targets **DEMO** (valores actuales sí son reales).
  - "Esta semana" (`applications_this_week`) → **DEMO/0** (no lo da el backend).
- **⚠️ Bug del KPI 763 vs 45 (a corregir en rediseño):**
  - "Solicitudes activas = **763**" → `stats.submitted+processing`, donde `submitted` **incluye `COMPLETED`** (`normalizers.ts:222`). Cuenta completadas como activas, sobre TODA la DB.
  - "**45** en curso" → `activeApps.length`, filtrado (`isActivePipelineStatus`, `dealerFormat.ts:158`) sobre la **lista paginada** (mucho menor que toda la DB).
  - Dos universos distintos (agregado total vs página) + bug semántico → nunca cuadran.
  - **Rediseño honesto:** o KPI "Activas" = suma de estados en-vuelo de `states{}` (excluyendo `DRAFT`/`COMPLETED`/`FAILED`), o etiquetar claramente "Total histórico" vs "En curso".

### 2. Solicitudes · `/credit-hub/dealer/applications`
- **Componente:** `DealerApplicationsListView` · **Endpoint:** `GET /api/v2/credit/applications`
- **REAL:** `applicant_name`, `vehicle_make/model/year`, `requested_amount`, `state` (→ `status` vía map), `created_at`.
- **DEMO/faltante:** `updated_at` (cae a `created_at`), `score` (null). Paginación real (el `total` puede no reflejar DB).

### 3. Nueva solicitud · `/credit-hub/dealer/applications/new/applicant`
- **Componente:** `StepApplicant` → `DealerWizardApplicantEmploymentStep` (wizard `components/forge/credit-hub`)
- **Catálogos:** import estático JS (sin HTTP). **Branding:** `GET /api/v2/tenants/{id}/branding`.
- **Submit (pasos finales):** `POST /api/v2/credit/applications`, `POST .../{id}/process` — REAL.
- **DEMO:** nada crítico; los catálogos son locales por diseño.

### 4. Detalle · `/credit-hub/dealer/applications/[applicationId]`
- **Componente:** `DealerApplicationDetailView` (comparador de ofertas = **JSX inline**, no `OfferComparisonTable`)
- **Endpoints:** `GET /api/v2/credit/applications/{id}` + `/events` + `GET /credit/applications/{id}/offers` (+ accept POST)
- **REAL ofertas:** `interest_rate_apr`/`apr_annual` (APR), `term_months` (plazo), `monthly_payment` (cuota), `amount_approved` (monto), `lender_code`/`lender_name` (banco), `status`.
- **DEMO/faltante:** estipulaciones solo si llega shape legacy `terms.stipulations` (en `OfferRow` no vienen).

### 5. Preaprobación · `/credit-hub/dealer/preapproval`
- **Componente:** `PreApprovalView` → `PreApprovalSimulator`
- **Endpoint:** **ninguno** — `calculateScenario()` 100% client-side; escenarios en `sessionStorage`.
- **REAL:** nada del backend. **DEMO/local:** todo el simulador (por diseño, es una calculadora).

### 6. Notificaciones · `/credit-hub/dealer/notifications`
- **Componente:** `DealerNotificationsView` · **Endpoint:** `GET /api/v2/credit/applications`
- **DERIVADO (no hay endpoint de notificaciones):** `notificationsFromApplications()` fabrica items desde la lista; estado leído/no-leído en `sessionStorage`. Marcado `TODO` en código.
- **Rediseño:** tratar como DERIVADO hasta que exista un endpoint real.

### 7. Perfil · `/credit-hub/dealer/profile`
- **Componente:** `DealerProfileView` · **Endpoint:** `GET /api/v2/tenants/{id}/branding`
- **REAL:** `institution_name`, `locale`, `currency_code`, branding del tenant.

---

## BANCO

### 8. Panel · `/credit-hub/bank`
- **Componente:** `BankDashboardView` · **Endpoints:** `queue` + `analytics/dashboard?period=30d`
- **REAL:** items de cola (nombre/dealer/vehículo/monto/score/risk/priority); métricas (`applications_by_status`, `approval_rate`, `top_dealers`, `portfolio_value`, `cohort_analysis`, `default_prediction`).
- **DEMO/faltante:** `avg_decision_time_hours` = **null** (no mostrar como dato real).

### 9. Bandeja · `/credit-hub/bank/applications`
- **Componente:** `BankApplicationsTable` → `QueueTable` · **Endpoint:** `queue` (+ `bulk-decide` POST)
- **REAL:** `applicant_name`, `dealer_name`, `vehicle_label`, `requested_amount`, `score`, `risk_level`, `approval_band`, `priority`, `state`, `application_id`. **Este es el patrón que YA pinta dato real bien** (ver `04_DESIGN_SYSTEM_REAL.md`).
- **DEMO/faltante:** `total` de la cola = tamaño de página, no total de DB.

### 10. Detalle · `/credit-hub/bank/applications/[applicationId]`
- **Componente:** `BankDetailLayout` · **Endpoints:** `applications/{id}` + `compliance/{id}` + `audit-trail` + `counter-offer` (+ `claim`/`decide` POST)
- **REAL:** `applicant.*`, `vehicle.label|make|model`, `financial.requested_amount|term_months|requested_rate`, análisis IA (`score`, `risk_level`, `approval_band`...), compliance Ley 172-13, audit-trail, counter-offer (términos por reglas).
- **DEMO/faltante:** algunos defaults en `BankDetailLayout` (rate 17.5, term 48) son **fallbacks** cuando el dato no viene — etiquetar.

### 11. Analítica · `/credit-hub/bank/analytics`
- **Componente:** `BankAnalyticsView` · **Endpoints:** `analytics/dashboard` + `dealers-ranking` + `portfolio-health`
- **REAL:** `top_dealers`/`dealers` (ranking per-DEALER), `cohort_analysis`, `approval_rate`, `portfolio_value`, `default_prediction`, **`score_distribution`** (de portfolio-health).
- **DEMO/faltante:** **ranking per-BANCO no existe** (`banks-ranking` 404). `avg_decision_time_hours` null.

### 12. Auditoría · `/credit-hub/bank/audit`
- **Componente:** `BankAuditView` · **Endpoint:** `queue?limit=50` + N× `applications/{id}/audit-trail`
- **REAL:** eventos (`event`, `timestamp`, `by`, `decision`). **Coste:** hasta 50 requests (agregación en front).

### 13. Cumplimiento · `/credit-hub/bank/compliance`
- **Componente:** `BankComplianceView` · **Endpoint:** `queue` + N× `compliance/{id}`
- **REAL:** flags Ley 172-13, `issues[]` (`type`, `severity`, `action_required`).

---

## Resumen "real vs demo" por persona

| Persona | REAL sólido | DEMO / sin endpoint |
|---|---|---|
| **Dealer** | Pipeline por etapa, score prom., tasa aprob., lista (nombre/vehículo/monto), ofertas (APR/plazo/cuota/monto/banco) | `BankRanking`, `DealerGoals` (targets), "Esta semana", Notificaciones (derivadas), Preaprobación (local) |
| **Banco** | Bandeja completa, detalle + análisis IA, counter-offer, audit, compliance, analítica (cohort, ranking dealers, score_distribution, portfolio_value) | `avg_decision_time_hours` (null), ranking per-banco (404) |

> **Para Claude Design:** el dealer tiene MENOS dato propio real que el banco. El rediseño del dealer
> debe apoyarse en `states{}` (pipeline), lista de solicitudes y ofertas; y **etiquetar como DEMO**
> ranking de bancos y metas hasta que existan endpoints. El banco ya tiene casi todo real.
