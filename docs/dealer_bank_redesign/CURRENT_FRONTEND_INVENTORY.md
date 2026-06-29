# CURRENT FRONTEND INVENTORY — Dealer / Banco (2026-06-28)

> Matriz **componente REAL montado** × ruta × endpoints × badge de honestidad.  
> Vestigios marcados explícitamente — no editar.

## Leyenda

| Badge | Significado |
|-------|-------------|
| **REAL** | Endpoint vivo, dato de DB/tenant |
| **DERIVADO** | Calculado en front desde payload real |
| **DEMO** | Ilustrativo / objetivos / serie sin backend |
| **ROADMAP** | Capacidad planificada, UI disabled o placeholder |

---

## DEALER

| Ruta | Actor | Componente REAL | Vestigio (no renderiza) | Endpoints | Badge hoy |
|------|-------|-----------------|-------------------------|-----------|-----------|
| `/credit-hub/dealer` | dealer | `DealerDashboardView` | `DashboardHero`, `DealerCommandHero` | `GET /stats`, `GET /applications`, `GET /credit/dashboard/summary`, `GET /analytics/banks-ranking` | Mix REAL + DEMO metas/tendencias |
| `/credit-hub/dealer/applications` | dealer | `DealerApplicationsListView` | — | `GET /applications` | REAL |
| `/credit-hub/dealer/applications/new/*` | dealer | `DealerWizardFrame` + steps forge | — | `POST /applications`, branding | REAL |
| `/credit-hub/dealer/applications/[id]` | dealer | `DealerApplicationDetailView` | `OfferComparisonTable.tsx` (huérfano) | `GET /applications/{id}`, `/offers`, accept POST | REAL ofertas |
| `/credit-hub/dealer/preapproval` | dealer | `PreApprovalSimulator` | — | ninguno (client calc) | DEMO by design |
| `/credit-hub/dealer/notifications` | dealer | `DealerNotificationsView` | — | derivado de applications | DERIVADO |
| `/credit-hub/dealer/profile` | dealer | `DealerProfileView` | — | `GET /tenants/{id}/branding` | REAL |

### Foco rediseño — Inicio (`DealerDashboardView`)

Módulos montados (orden visual spec):

| Módulo | Archivo | Fuente datos | Badge |
|--------|---------|--------------|-------|
| Header cockpit | `dealer/elite/DealerCockpitHeader.tsx` | tenant + auth | REAL |
| KPI strip 8 | `dealer/elite/DealerKpiStrip.tsx` | stats, summary, banks-ranking | REAL (+ sparkline DEMO) |
| Metas mes | `dealer/sections/DealerGoals.tsx` | stats + apps (targets ilustrativos) | DEMO targets |
| Comparador estrella | `dealer/elite/OfferComparatorSpotlight.tsx` | `useApplicationOffers` | REAL |
| Pipeline + rail | `dealer/elite/DealerPipelineRail.tsx` | `applications_by_display_status` | REAL / DEMO rail parcial |
| Ranking bancos | `dealer/sections/BankRanking.tsx` | `banks-ranking` | REAL |
| Solicitudes recientes | `dealer/elite/RecentApplicationsTable.tsx` | applications + humanizeApplicant | REAL |
| Tendencias + alertas | `dealer/elite/DealerTrendsAlerts.tsx` | cohortes ilustrativas + heurísticas | DEMO |
| Footer | `elite/ComplianceFooter.tsx` | copy estático | REAL (política) |

---

## BANCO

| Ruta | Actor | Componente REAL | Vestigio | Endpoints | Badge hoy |
|------|-------|-----------------|----------|-----------|-----------|
| `/credit-hub/bank` | bank | `BankDashboardView` | `BankDashboardHero`, `BankDetailView` legacy | `queue`, `analytics/dashboard`, `auction-intel`, `risk-distributions` | REAL + ROADMAP SLA |
| `/credit-hub/bank/applications` | bank | `BankApplicationsTable` → `QueueTable` | — | `GET /applications/queue` | REAL |
| `/credit-hub/bank/applications/[id]` | bank | `BankDetailLayout` | `forge/BankApplicationDetailView` | review, decide, compliance, audit | REAL |
| `/credit-hub/bank/analytics` | bank | `BankAnalyticsView` | — | dashboard, portfolio-health | REAL (+ DEMO default KPI extremo) |
| `/credit-hub/bank/compliance` | bank | compliance pages | — | compliance reports | REAL |
| `/credit-hub/bank/audit` | bank | `BankAuditView` | — | audit-trail | REAL |

### Foco rediseño — Mesa (`BankDashboardView`)

| Módulo | Archivo | Fuente | Badge |
|--------|---------|--------|-------|
| Header | `bank/elite/BankCockpitHeader.tsx` | tenant + queue heuristics | REAL |
| KPI strip | `BankDashboardView` + `MetricCard` | analytics + queue | REAL / ROADMAP tiempo decisión |
| Cola decisión | `QueueTable` | queue | REAL |
| Auction intel | `sections/AuctionIntel.tsx` | `auction-intel` (sin nombres competidor) | REAL |
| Riesgo | `sections/RiskCreditPanel.tsx` | `risk-distributions` | REAL |
| Footer aislamiento | `ComplianceFooter` | copy | REAL |

---

## Endpoints conectados en este PR

| Endpoint | Hook / client | Panel |
|----------|---------------|-------|
| `GET /credit/dashboard/summary` | `useDashboardSummary` | Pipeline display_status, ofertas total |
| `GET /api/v2/credit/analytics/banks-ranking` | `useBanksRanking` | Ranking dealer + KPI APR/tiempo |
| `GET /api/v2/credit/analytics/risk-distributions` | `useRiskDistributions` | Panel riesgo banco |
| `GET /api/v2/credit/analytics/auction-intel` | `useAuctionIntel` | Subasta banco (aislado) |

---

## Aislamiento banco/dealer

- **Dealer:** ve multi-banco en comparador (`/credit/applications/{id}/offers`).
- **Banco:** auction-intel **no renderiza** `winning_lender` ni tasas competidoras; footer + copy explícitos.

---

## Problemas UX conocidos (no regresión)

- Wizard paso 1: fix #214 — no tocar stepper gate.
- KPI histórico 763 vs 45: corregido vía `activePipelineCountFromStats` (excluye COMPLETED).
- Default prediction 100% en analytics: badge DEMO en #212.
