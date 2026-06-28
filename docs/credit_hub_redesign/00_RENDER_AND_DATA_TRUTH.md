# 00 · RENDER AND DATA TRUTH — Fase 0 (obligatoria)

> Generado antes del rediseño SUPERLOOP. Repo `nadakki-dashboard` @ `22bf7c1`.
> Probe producción `nadakki-ai-suite.onrender.com`, tenant `nadakki-demo` (401 sin token = existe).
> Campos de endpoints sin `response_model` verificados contra código backend `nadakki-ai-suite`.

## Regla de oro

**Solo editar componentes importados por `app/(forge)/credit-hub/**/page.tsx`.**
Los árboles `components/credit/*` y heroes huérfanos en `components/credit-hub/**/DashboardHero.tsx` son **fantasmas**.

---

## Dealer — pantalla → componente REAL

| Pantalla | URL | page.tsx | Componente REAL | ¿Fantasma? |
|---|---|---|---|---|
| **P1 Inicio** | `/credit-hub/dealer` | `dealer/page.tsx` | `DealerDashboardView` | NO |
| Solicitudes | `/credit-hub/dealer/applications` | `applications/page.tsx` | `DealerApplicationsListView` | NO |
| Nueva | `.../new/applicant/page.tsx` | `StepApplicant` → wizard forge | NO |
| Detalle | `.../[applicationId]/page.tsx` | `DealerApplicationDetailView` | NO |
| Preaprobación | `preapproval/page.tsx` | `PreApprovalView` | NO |
| Notificaciones | `notifications/page.tsx` | `DealerNotificationsView` | NO |
| Perfil | `profile/page.tsx` | `DealerProfileView` | NO |

**Texto literal en Inicio:** `"Solicitudes activas"` / `"enviadas + en proceso"` → `DealerDashboardView.tsx` (grep confirmado).

**Fantasmas (NO tocar):** `DashboardHero.tsx`, `DealerCommandHero.tsx`, `OfferComparisonTable.tsx`, `DealerApplicationStatusView.tsx`.

---

## Banco — pantalla → componente REAL

| Pantalla | URL | Componente REAL |
|---|---|---|
| **P3 Panel** | `/credit-hub/bank` | `BankDashboardView` |
| Bandeja | `/credit-hub/bank/applications` | `BankApplicationsTable` → `QueueTable` |
| Detalle | `.../[applicationId]` | `BankDetailLayout` |
| **P6 Analítica** | `bank/analytics` | `BankAnalyticsView` |
| **P5 Auditoría** | `bank/audit` | `BankAuditView` |
| **P5 Cumplimiento** | `bank/compliance` | `BankComplianceView` |

**Fantasmas:** `BankDashboardHero`, `BankDetailView`, `BankApplicationDetailView` (forge).

---

## Endpoints nuevos (probe 2026-06-28)

| Endpoint | Status | Veredicto |
|---|---|---|
| `GET /api/v2/credit/stats` | 401 | EXISTE |
| `GET /api/v2/credit/analytics/banks-ranking` | **404** | NO EXISTE → DEMO |
| `GET /api/v2/credit/analytics/risk-distributions` | **404** | NO EXISTE → ROADMAP |
| `GET /api/v2/credit/auction-intel` | **404** | NO EXISTE → DEMO |
| `GET /api/v2/credit/analytics/segmented-report` | **404** | NO EXISTE → ROADMAP |
| `GET /api/v2/credit/goals` | **404** | NO EXISTE → DEMO |
| `GET /api/v2/credit/display-status` | **404** | NO EXISTE → derivar en front |

`docs/credit_hub_core/BACKEND_TRANSFORM_REPORT.md` **no existe aún** en el repo.

---

## P1 Dealer Command Center — mapa panel → badge → endpoint

| Panel / KPI | Badge | Endpoint / fuente |
|---|---|---|
| Header Command Center | REAL | shell + tenant branding |
| KPI En curso | REAL | `GET /api/v2/credit/stats` → `states{}` (sin COMPLETED) |
| KPI Esta semana | REAL | derivado de `GET /api/v2/credit/applications` (`created_at`) |
| KPI Score / Tasa | REAL | `stats.avg_score`, `stats.approval_rate` |
| Mejor siguiente acción | REAL | derivado de lista + estados |
| Alertas operativas | REAL | derivado de lista (incompletos, trabadas, ofertas) |
| Ofertas pendientes | REAL | apps con status offered/approved |
| Tarjetas solicitudes | REAL | `applications[]` (`applicant_name`, `vehicle_*`, `requested_amount`) |
| Pipeline funnel | REAL | `normalizeStats` → buckets por `states` |
| Ranking bancos | **DEMO** | sin `banks-ranking` — `DEMO_BANKS` |
| Metas del mes | **DEMO** | targets ilustrativos; valores actuales REAL |
| Preaprobación (link) | REAL (local) | sin API — calculadora client |

**Fix aplicado en P1:** `normalizeStats` ya no cuenta `COMPLETED` como "enviadas".
`humanizeApplicant` — nunca UUID crudo como título.

---

## P2–P7 (plan de badge por portal)

| Portal | Componente REAL | REAL hoy | DEMO/ROADMAP |
|---|---|---|---|
| P2 Wizard | `Step*` + `DealerWizardProvider` | POST applications, catalogs | segmento LATAM campos nuevos (additive) |
| P3 Bank Workbench | `BankDashboardView`, `BankApplicationsTable`, `BankDetailLayout` | queue, detail, decide | SLA analista (derivado) |
| P4 Auction | `DealerApplicationDetailView` offers section | `/credit/.../offers`, accept | auction-intel 404 |
| P5 Compliance | `BankAuditView`, `BankComplianceView` | audit-trail, compliance | adverse action UI parcial |
| P6 Analytics | `BankAnalyticsView` | dashboard, portfolio-health, dealers-ranking | risk-distributions, segmented-report 404 |
| P7 Admin OS | **nuevo** `app/(forge)/credit-hub/admin` | health, tenants branding | billing, Power BI ROADMAP |

---

## Datos vacíos (nadakki-demo)

Si `applicant_name` viene null en payload → **empty-state digno** (`Sin datos de cliente · folio …`), no UUID.
Esto es comportamiento de datos SANDBOX, no bug de componente.
