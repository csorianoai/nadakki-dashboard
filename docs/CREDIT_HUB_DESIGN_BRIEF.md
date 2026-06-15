# Credit Hub — Design Brief for Claude Design Handoff

**Repo:** `nadakki-dashboard` · **Branch:** `audit/credit-hub-design-handoff`  
**Date:** 2026-06-14 · **Author:** Cursor audit (read-only)  
**Reference quality bar:** `/market-intel` (MEE redesign, PR #129) — institutional, amber accent, dense data surfaces.

> **Scope of this document:** Current-state inventory for Claude Design. **Do not change routes, API contracts, auth hooks (PR #128), or tenant flags.** Design may introduce `--ch-*` tokens or reuse `--mee-*` / `--forge-*` aliases.

---

## Executive summary

| Metric | Value |
|--------|-------|
| Production Forge routes (`/credit-hub/*`) | **22 pages** |
| Legacy duplicate routes (`/credit/*`, `/bank/*`, `/(bank)/*`) | **~17 pages** |
| **Total distinct URLs in scope** | **~39** → exceeds 30-page threshold |
| OpenAPI in repo | **None** — shapes from `lib/credit-hub/types/*` + client usage |
| Runtime capture (2026-06-14) | Playwright blocked (`spawn UNKNOWN` on Windows); visual audit uses Phase 6 inventory screenshots + code review |

**Recommendation:** Split Claude Design into **two packages — Bank Portal** and **Dealer Portal** — plus a shared **Forge shell / tokens** pass. See [§7 Recommendation](#7-recommendation-bank-vs-dealer-vs-single-pass).

---

## 1. Inventario de páginas

### 1.1 Producción — Forge Credit Hub (`app/(forge)/credit-hub/`)

Layout chain: `app/(forge)/layout.tsx` → `credit-hub/layout.tsx` (`CreditHubLayoutClient` → `ForgeCreditHubAppShell`) → persona sub-layouts.

| URL | Archivo(s) | Persona | Estado | Componentes principales |
|-----|------------|---------|--------|-------------------------|
| `/credit-hub` | `page.tsx`, `layout.tsx` | Ambos | Producción | Portal picker cards (`ForgeCard`, `ForgeLogo`) |
| `/credit-hub/preview` | `preview/page.tsx` | Dev | WIP / playground | All Forge primitives demo |
| `/credit-hub/components` | `components/page.tsx` | Dev | WIP | Legacy component catalog |
| `/credit-hub/bank` | `bank/page.tsx`, `bank/layout.tsx` | Bank | Producción | Hero `Card`, `KpiCard`×4, queue `DataTable`, `MicroChart`×2, `EmptyState` |
| `/credit-hub/bank/applications` | `bank/applications/page.tsx` | Bank | Producción | Search (URL `?q=&page=`), bulk actions, `DataTable`, `BankQueuePagination` |
| `/credit-hub/bank/applications/[applicationId]` | `bank/applications/[applicationId]/page.tsx` | Bank | Producción | `BankApplicationDetailView` (tabs, decision panel, `AuditTimeline`, `EvidenceCard`) |
| `/credit-hub/bank/analytics` | `bank/analytics/page.tsx` | Bank | Producción | `BankExecutiveMetrics`, `BankAnalyticsCharts`, `BankDealerRanking`, `BankPortfolioHealth` |
| `/credit-hub/bank/audit` | `bank/audit/page.tsx` | Bank | Producción | Queue-derived `AuditTimeline`, `EmptyState` |
| `/credit-hub/bank/compliance` | `bank/compliance/page.tsx` | Bank | Producción | KPI cards, issues list, RTBF card, `getForgeComplianceSurface()` copy |
| `/credit-hub/dealer` | `dealer/page.tsx`, `dealer/layout.tsx` | Dealer | Producción | Greeting hero, `KpiCard`, active apps `DataTable`, CTA nueva solicitud |
| `/credit-hub/dealer/applications` | `dealer/applications/page.tsx` | Dealer | Producción | Status tabs, density selector, search, `DataTable` |
| `/credit-hub/dealer/applications/[applicationId]` | `dealer/applications/[applicationId]/page.tsx` | Dealer | Producción | `DealerApplicationStatusView` |
| `/credit-hub/dealer/preapproval` | `dealer/preapproval/page.tsx` | Dealer | Producción | `PreApprovalSimulator`, scenario charts |
| `/credit-hub/dealer/applications/new` | `dealer/applications/new/page.tsx` | Dealer | Producción | Redirect / preset loader |
| `/credit-hub/dealer/applications/new/applicant` | `…/applicant/page.tsx`, `…/new/layout.tsx` | Dealer | Producción | `DealerWizardApplicantEmploymentStep`, wizard chrome |
| `/credit-hub/dealer/applications/new/co-borrower` | `…/co-borrower/page.tsx` | Dealer | Producción | `DealerWizardCoBorrowerStep` |
| `/credit-hub/dealer/applications/new/vehicle` | `…/vehicle/page.tsx` | Dealer | Producción | `DealerWizardVehicleFinancialStep` |
| `/credit-hub/dealer/applications/new/documents` | `…/documents/page.tsx` | Dealer | Producción | `DealerWizardDocumentsStep` |
| `/credit-hub/dealer/applications/new/consent` | `…/consent/page.tsx` | Dealer | Producción | `DealerWizardConsentStep` (SMS/Email/WhatsApp/Selfie methods) |
| `/credit-hub/dealer/applications/new/complete` | `…/complete/page.tsx` | Dealer | Producción | Submission confirmation |
| `/credit-hub/dealer/notifications` | `dealer/notifications/page.tsx` | Dealer | **Placeholder** | `EmptyState` “próximamente” |
| `/credit-hub/dealer/profile` | `dealer/profile/page.tsx` | Dealer | **Placeholder** | `EmptyState` “próximamente” |

**Wizard layout:** `dealer/applications/new/layout.tsx` → `DealerNewApplicationLayoutClient` → `DealerWizardProvider` + `DealerWizardChrome` (5 steps: Solicitante → Co-firmante → Vehículo → Documentos → Consentimiento).

### 1.2 Legacy / duplicados (no rediseñar como fuente de verdad)

| URL | Archivo | Persona | Estado | Notas |
|-----|---------|---------|--------|-------|
| `/credit`, `/credit/dashboard` | `app/credit/page.tsx`, `dashboard/page.tsx` | Ambos | Legacy | Pre-Forge shell |
| `/credit/new`, `/credit/[id]/*` | `app/credit/new`, `[id]/*` | Customer/Dealer | Legacy | Old applicant flow |
| `/credit/bank`, `/credit/bank/[applicationId]` | `app/credit/bank/*` | Bank | Legacy duplicado | Redirect candidates |
| `/credit/dealer/*` | `app/credit/dealer/*` | Dealer | Legacy duplicado | Includes `real`, `analytics` |
| `/credit/status/[applicationId]` | `app/credit/status/*` | Customer | Legacy | Public status |
| `/bank/analytics` | `app/bank/analytics/page.tsx` | Bank | Legacy | Outside Forge shell |
| `/(bank)/bank/applications/[id]` | `app/(bank)/bank/applications/[id]/page.tsx` | Bank | Legacy | Stipulations sibling route |
| `/(bank)/workflow-real` | `app/(bank)/workflow-real/page.tsx` | Bank | Legacy / demo | Real workflow prototype |

**Design directive:** Treat `/credit-hub/*` as canonical. Legacy routes exist for migration; new visual system should not fork per legacy URL.

---

## 2. Shape del backend por página

**Base paths:** Bank APIs → `/api/v2/credit/*` via `chFetch` (`lib/credit-hub/api/client.ts`). Dealer list/create → `/api/v2/credit/*` via `creditCoreFetch` (`creditCoreClient.ts`). No `openapi.json` in repo.

### 2.1 Bank — Dashboard (`/credit-hub/bank`)

| Hook | Endpoint | Response type |
|------|----------|---------------|
| `useBankQueue()` | `GET /api/v2/credit/applications/queue?limit=&offset=` | `BankQueueResponse` |
| `useBankAnalytics()` | `GET /api/v2/credit/analytics/dashboard?period=` | `BankDashboardAnalytics` |

**UI states:** `idle` → `loading` (Skeleton on KPIs / table) → `success` | `empty` (zero queue → `EmptyState`) | `error` (queue API fail → error `EmptyState`).

**Volume charts:** `BANK_DASHBOARD_VOLUME_MOCK` and `BANK_DASHBOARD_APPROVAL_MOCK` are **hard-coded empty arrays** — charts always show empty until a volume-series API exists.

```typescript
// lib/credit-hub/types/bankDecision.ts (excerpt)
export interface BankQueueItem {
  application_id: string;
  tenant_id: string;
  state: string;
  applicant_name: string | null;
  dealer_id: string | null;
  dealer_name: string | null;
  vehicle_label: string | null;
  requested_amount: number;
  score: number;
  risk_level: string | null;
  approval_band: string | null;
  priority: "ALTA" | "MEDIA" | "BAJA";
  created_at: string | null;
  bank_decision: BankDecision | null;
}

export interface BankQueueResponse {
  applications: BankQueueItem[];
  total: number;
  total_count?: number;
  tenant_id: string;
}

export interface BankDashboardAnalytics {
  applications_by_status: Record<string, number>;
  approval_rate: number;
  avg_decision_time_hours: number | null;
  top_dealers: Array<{ dealer: string; volume: number; approved: number; approval_rate: number }>;
  portfolio_value: number;
  default_prediction: { rule: string; predicted_default_count: number; predicted_default_rate: number };
  cohort_analysis: Array<{ period: string; applications: number; approved: number; approval_rate: number }>;
  total_applications: number;
}
```

### 2.2 Bank — Applications list (`/credit-hub/bank/applications`)

| Hook | Endpoint | Notes |
|------|----------|-------|
| `useBankQueue({ limit, offset, filters: { q } })` | `GET …/queue?limit=20&offset=&q=` | URL-synced pagination (`BankQueuePagination`) |
| `useBulkActions()` | `POST /api/v2/credit/applications/bulk-decide` | Body: `{ application_ids, rule, analyst_id, justification }` → `BulkDecisionResult` |

**Sort:** Column headers do **not** wire `onSort` on `DataTable` — display order is API default (“puntaje descendente” copy only).

### 2.3 Bank — Application detail (`/credit-hub/bank/applications/[id]`)

| Hook | Endpoint | Response |
|------|----------|----------|
| `useBankApplication(id)` | `GET /api/v2/credit/applications/{id}` | `BankReviewApplication` |
| `useBankCompliance(id)` | `GET /api/v2/credit/compliance/{id}` | `ComplianceReport` |
| `useBankAuditTrail(id)` | `GET /api/v2/credit/applications/{id}/audit-trail` | `BankAuditTrail` |
| `useBankCounterOffer(id)` | `GET …/counter-offer` | `CounterOffer` |
| `useBankDecision()` | `POST …/claim` then `POST …/decide` | `BankDecision` |

```typescript
export interface BankReviewApplication {
  application_id: string;
  tenant_id: string;
  state: string;
  application_payload: {
    analysis?: CreditAnalysisResult;
    bank_decision?: BankDecision;
    audit_trail?: BankAuditEvent[];
    applicant?: Record<string, unknown>;
    financial?: Record<string, unknown>;
    vehicle?: Record<string, unknown>;
    documents?: unknown;
    [key: string]: unknown;
  };
}

// lib/credit-hub/types/creditAnalysis.ts — nested in payload
export interface CreditAnalysisResult {
  score: number;
  risk_level: CreditRiskLevel;
  approval_band: CreditApprovalBand;
  explanation: string;
  confidence: number;
  metrics?: CreditAnalysisMetrics;
  positive_factors: string[];
  negative_factors: string[];
  engine: "forge_rule_based_v1";
}
```

**Compliance approve:** `POST /api/v2/credit/applications/{id}/compliance/approve` → `{ compliance: { status: "approved", approved_at, approved_by } }`.

### 2.4 Bank — Analytics (`/credit-hub/bank/analytics`)

| Hook | Endpoint | Response |
|------|----------|----------|
| `useBankAnalytics()` | `GET /api/v2/credit/analytics/dashboard` | `BankDashboardAnalytics` |
| `useBankDealersRanking()` | `GET /api/v2/credit/analytics/dealers-ranking` | `{ dealers: top_dealers[] }` |
| `useBankPortfolioHealth()` | `GET /api/v2/credit/analytics/portfolio-health` | **`Record<string, unknown>` — shape unknown** |

**Inferred portfolio-health usage:** UI reads `data.score_distribution` as `Record<string, number>`. Other fields undocumented — **requires backend consult** if Design needs KPI labels beyond score bands.

### 2.5 Bank — Audit (`/credit-hub/bank/audit`)

| Hook | Endpoint | Notes |
|------|----------|-------|
| `useBankQueue()` | Same queue endpoint | **No dedicated audit API** — timeline synthesized from queue rows |

Synthetic fields in timeline: `Target hash {hex}` and `IP —` are **client-generated placeholders**, not backend audit data.

### 2.6 Bank — Compliance (`/credit-hub/bank/compliance`)

| Hook | Endpoint | Notes |
|------|----------|-------|
| `useBankQueue()` | Queue endpoint | Derives compliance % from `bank_decision.compliance_check.ley_172_13_compliant` on queue items — **not** `ComplianceReport` per app |

Regulatory copy from `getForgeComplianceSurface(tenantConfig)` (CNBV vs Ley 172-13 by tenant jurisdiction).

### 2.7 Dealer — Dashboard & list

| Hook | Endpoint | Response |
|------|----------|----------|
| `useCreditApplications()` | `GET /api/v2/credit/applications` | `CreditApplication[]` (normalized) |
| `useCreditStats()` | `GET /api/v2/credit/stats` | `CreditStats` |

```typescript
export interface CreditApplication {
  id: string;
  application_id: string;
  applicant_name: string;
  requested_amount: string;
  status: CreditApplicationStatus;
  score: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  created_at: string;
  updated_at: string;
  raw: unknown;
}

export interface CreditStats {
  total_applications: number;
  draft_applications: number;
  submitted_applications: number;
  processing_applications: number;
  approved_applications: number;
  rejected_applications: number;
  applications_this_week: number;
  average_score: number | null;
  approval_rate: number | null;
}
```

### 2.8 Dealer — Wizard (steps 1–5 + complete)

| Action | Endpoint | Body / response |
|--------|----------|-----------------|
| Create draft | `POST /api/v2/credit/applications` | `{ application_payload, initial_state: "DRAFT" }` → `CreditApplication` |
| Submit / process | `POST /api/v2/credit/applications/{id}/process` | `{ mode? }` → `CreditApplication` |
| Events | `GET /api/v2/credit/applications/{id}/events` | `CreditEvent[]` |

Wizard state: `DealerWizardProvider` — localStorage autosave (`nadakki_dealer_wizard_v1`), Zod-validated form slices. Payload shape: `CreateCreditApplicationPayload` in `lib/credit-hub/types/creditCore.ts`.

### 2.9 Dealer — Preapproval (`/credit-hub/dealer/preapproval`)

**Client-only simulation** via `lib/credit/simulation/scenario-engine` — no dedicated backend endpoint. “Convert to application” encodes inputs in URL: `/credit-hub/dealer/applications/new?preset={base64(JSON)}`.

### 2.10 Shared tenant / auth

| Hook | Endpoint | Notes |
|------|----------|-------|
| `useAuth()` (PR #128) | `GET /api/v2/auth/me` | `tenant.id`, roles — **do not redesign** |
| `useTenantConfig()` | `GET /api/v2/tenants/{slug}/branding` | Locale, currency, institution_name, primary_color |

---

## 3. Componentes reutilizables existentes

### 3.1 Forge barrel (`@/components/forge` — `components/forge/index.ts`)

| Componente | Path | Props principales | Uso en Credit Hub (páginas prod) |
|------------|------|-------------------|----------------------------------|
| `DataTable` | `components/forge/ui/DataTable.tsx` | `columns`, `rows`, `getRowId`, `density`, `loading`, `emptyLabel`, sort via `column.onSort` | Bank dashboard, applications; Dealer dashboard, applications |
| `KpiCard` | `components/forge/ui/KpiCard.tsx` | `label`, `value`, `icon`, `trend?`, `hint?` | Bank dashboard (×4); Dealer dashboard (×4) |
| `EmptyState` | `components/forge/ui/EmptyState.tsx` | `title`, `description`, `action`, `icon`, `tone`, `titleLevel` | All bank/dealer pages (empty/error) |
| `MicroChart` | `components/forge/ui/MicroChart.tsx` | `title`, `data[]`, `lineKeys`, `colors` | Bank dashboard Insights (empty data today) |
| `AuditTimeline` | `components/forge/ui/AuditTimeline.tsx` | `entries: { id, timestampLabel, actorLabel, actionLabel, detail, href? }[]` | Bank audit; detail view tab |
| `StatusPill` | `components/forge/ui/StatusPill.tsx` | `tone`, children | Queue tables, detail header |
| `Button`, `Input`, `Select`, `Card`, `Skeleton`, `Tabs`, `Modal`, `Drawer` | `components/forge/ui/*` | Standard Forge API | Widespread |
| `EvidenceCard` | `components/forge/ui/EvidenceCard.tsx` | `title`, `body`, `sourceLabel`, `confidence` | Bank detail analysis tab |
| `ForgeCreditHubAppShell` | `components/forge/layout/ForgeCreditHubAppShell.tsx` | children | All `/credit-hub/*` via layout |
| `ForgeCreditHubSidebar` / `Topbar` | `components/forge/layout/ForgeCreditHub*.tsx` | persona-aware nav | Shell |
| `ForgeCommandPalette` | via `ForgeCommandPaletteProvider` | Ctrl+K navigation | Shell |

### 3.2 Credit Hub domain (`components/credit-hub/` + `components/forge/credit-hub/`)

| Componente | Path | Rol | Páginas |
|------------|------|-----|---------|
| `BankApplicationDetailView` | `components/forge/credit-hub/BankApplicationDetailView.tsx` | Full review + decide UX | Bank detail |
| `BankExecutiveMetrics` | `components/credit-hub/bank/BankExecutiveMetrics.tsx` | Analytics KPI strip | Analytics |
| `BankAnalyticsCharts` | `components/credit-hub/bank/BankAnalyticsCharts.tsx` | recharts cohort/status | Analytics |
| `BankDealerRanking` | `components/credit-hub/bank/BankDealerRanking.tsx` | Dealer table | Analytics |
| `BankPortfolioHealth` | `components/credit-hub/bank/BankPortfolioHealth.tsx` | Score band grid | Analytics |
| `BankQueuePagination` | `components/credit-hub/bank/BankQueuePagination.tsx` | URL page controls | Applications list |
| `DealerWizardChrome` | `components/forge/credit-hub/dealer/DealerWizardChrome.tsx` | Stepper + footer actions | Wizard |
| `DealerWizard*Step` | `components/forge/credit-hub/dealer/` | Form steps 1–5 | Wizard |
| `PreApprovalSimulator` | `components/credit-hub/dealer/preapproval/PreApprovalSimulator.tsx` | Local simulation | Preapproval |
| `DealerApplicationStatusView` | `components/forge/credit-hub/DealerApplicationStatusView.tsx` | Dealer detail | Dealer `[applicationId]` |
| `CreditAnalysisPanel` | `components/credit-hub/dealer/analysis/CreditAnalysisPanel.tsx` | Score breakdown | Bank detail, dealer analysis |
| `ApplicationStatusBadge` | `components/credit-hub/dealer/ApplicationStatusBadge.tsx` | Status chip | Dealer tables |

### 3.3 Dual primitive stacks (migration debt)

Legacy `components/credit-hub/primitives/ForgeCard`, `ForgeButton` coexist with `@/components/forge` primitives. Analytics and some bank widgets still import **legacy** primitives — Design should plan token unification, not new third stack.

---

## 4. Capturas del estado actual

**Capture method:** Phase 6 reusability screenshots (`app/(forge)/credit-hub/_design/_inventory/reusability-test/desktop/*.png`) captured against preview tenant **TestBank Mexico**. Live Playwright run failed on Windows (`browserType.launch: spawn UNKNOWN`); paths below are repo-relative references for Design.

### 4.1 Bank Dashboard — `/credit-hub/bank`

![Bank dashboard](../app/(forge)/credit-hub/_design/_inventory/reusability-test/desktop/bank-dashboard.png)

| Elemento | Estado actual |
|----------|---------------|
| Shell | Dark maroon sidebar “FORGE Bank”, broken logo placeholder, nav: Panel / Bandeja / Analítica / Cumplimiento / Auditoría |
| Hero | “Mesa de decisiones — TestBank Mexico”, compliance kicker, building icon |
| KPIs | 4 cards — **skeleton bars** (loading or empty API in capture) |
| Bandeja | Search “Filtrar vista”, table area = **3 skeleton rows** |
| Insights | Two `MicroChart` panels titled “Volume — last 30 days” / “Approval rate trend” — **empty series** in code |

### 4.2 Bank Analytics — `/credit-hub/bank/analytics`

No desktop capture in inventory; code shows: kicker “Riesgo, ROI y dealers”, `BankExecutiveMetrics`, dual charts, dealer ranking + portfolio health grid. **Design should treat as data-dense target** — charts exist but depend on analytics API population.

### 4.3 Bank Applications — `/credit-hub/bank/applications`

![Bank applications list](../app/(forge)/credit-hub/_design/_inventory/reusability-test/desktop/bank-applications-list.png)

| Elemento | Estado actual |
|----------|---------------|
| Hero | “Solicitudes priorizadas”, motor score subtitle |
| Search | Full-width with magnifier; sort hint text only (not interactive) |
| Table | **Skeleton bars** — no row data in capture |
| Bulk | Checkbox column + rule selector present in code (not visible in skeleton state) |

### 4.4 Bank Application Detail — `/credit-hub/bank/applications/[id]`

![Bank application detail](../app/(forge)/credit-hub/_design/_inventory/reusability-test/desktop/bank-application-detail.png)

| Elemento | Estado actual |
|----------|---------------|
| Body | **Single large grey placeholder block** — detail view failed to hydrate in capture (historically SSR 500; fixed per `_design/_inventory/ssr_root_cause_phase4_detail.md`) |
| Expected (code) | Tabs: overview, analysis (`CreditAnalysisPanel`, `ScoreVisual`), decision panel, compliance, audit; sticky action bar Approve/Reject/Counter |

### 4.5 Bank Audit — `/credit-hub/bank/audit`

![Bank audit](../app/(forge)/credit-hub/_design/_inventory/reusability-test/desktop/bank-audit.png)

| Elemento | Estado actual |
|----------|---------------|
| Header | “Visor de auditoría”, link to bandeja |
| Content | **Empty grey card** — no timeline entries (empty queue in capture) |

### 4.6 Bank Compliance — `/credit-hub/bank/compliance`

![Bank compliance](../app/(forge)/credit-hub/_design/_inventory/reusability-test/desktop/bank-compliance.png)

| Elemento | Estado actual |
|----------|---------------|
| Hero | “Perfil CNBV (México)” — jurisdiction-aware title |
| Body | **Large empty grey block** below hero — KPI grid not visible in capture (loading skeleton) |

### 4.7 Dealer Dashboard — `/credit-hub/dealer`

![Dealer dashboard](../app/(forge)/credit-hub/_design/_inventory/reusability-test/desktop/dealer-dashboard.png)

| Elemento | Estado actual |
|----------|---------------|
| Shell | Maroon “FORGE Dealer” sidebar; broken logo |
| Hero | Time greeting + “+ Nueva solicitud” CTA |
| KPIs | **4 empty grey placeholders** |
| Active apps | **Large empty block** for table |

### 4.8 Dealer Wizard Step 1 — `/credit-hub/dealer/applications/new/applicant`

![Dealer wizard step 1](../app/(forge)/credit-hub/_design/_inventory/reusability-test/desktop/dealer-applications-new-step1.png)

| Elemento | Estado actual |
|----------|---------------|
| Stepper | 5 steps — step 1 active (maroon pill) |
| Form | Two-column applicant fields (document type INE default — **jurisdiction mismatch** with DO tenant in other copy) |
| Footer | Sticky bar: Anterior (disabled), Guardar borrador, Siguiente (disabled until valid) |
| UX | Functional but flat inputs; no mobile card layout |

### 4.9 Dealer Applications — `/credit-hub/dealer/applications`

![Dealer applications list](../app/(forge)/credit-hub/_design/_inventory/reusability-test/desktop/dealer-applications-list.png)

| Elemento | Estado actual |
|----------|---------------|
| Filters | Status tabs (Todas, Borrador, Enviadas…) all **(0)** |
| Controls | Search + density dropdown “Cómoda” |
| Table | **Skeleton rows** |

### 4.10 Dealer Preapproval — `/credit-hub/dealer/preapproval`

No inventory PNG; code renders `PreApprovalSimulator` with sliders/inputs, amortization chart (`AmortizationChart`), scenario comparison cards, “Convertir a solicitud” CTA.

---

## 5. Bugs visuales y carencias identificadas

| Página | JSON crudo / `[object Object]` | Gráficas faltantes | Tabla sort/filter/page | Empty states | Loading |
|--------|-------------------------------|--------------------|------------------------|--------------|---------|
| Bank dashboard | No | **MicroCharts always empty** (mock arrays `[]`) | Filter local only; no server sort | Good copy via `forgeEmptyCopy` | Skeleton ✓ |
| Bank applications | No | N/A | **Filter ✓ URL `q`; sort ✗; pagination ✓** | Good | Skeleton ✓ |
| Bank detail | No | Analysis charts in tab when data present | N/A | Comments empty state ✓ | Skeleton on page load ✓ |
| Bank analytics | No | Charts depend on API — empty if no data | N/A | Implicit empty charts | No page-level skeleton |
| Bank audit | No | N/A | N/A | Generic queue-empty | Skeleton ✓ |
| Bank compliance | No | N/A | N/A | Success empty ✓ | Skeleton ✓ |
| Dealer dashboard | No | No trend charts | N/A | Generic | Skeleton ✓ |
| Dealer applications | No | N/A | **Filter tabs ✓; sort ✗; no pagination** | Tab counts show 0 | Skeleton ✓ |
| Dealer wizard | No | N/A | N/A | Inline validation | Step suspense skeleton |
| Dealer preapproval | No | Amortization chart present | N/A | Simulator defaults | Client-only |
| **Cross-cutting** | | | | | |

**Cross-cutting issues:**

1. **Broken tenant logo** in sidebar (placeholder image) across all captures.
2. **“UI preview” footer** in sidebar — dev artifact visible in production shell.
3. **Persona colors:** Bank portal uses maroon/navy serif hero; not yet aligned with MEE amber institutional palette.
4. **Audit page synthetic data** (`Target hash`, `IP —`) reads as debug copy — Design should replace with real audit fields when backend provides them.
5. **Bank audit/compliance pages** reuse queue API — misleading empty states when queue is empty but compliance issues exist elsewhere.
6. **Internal comment field** on bank detail explicitly says it does not persist — UX dead-end.
7. **Document type default “INE”** on wizard step 1 while tenant copy references República Dominicana — jurisdictional inconsistency.
8. **No dark/light parity** with MEE — Credit Hub uses `forge-globals.css` + `styles/forge-tokens-v2.css`, not `--mee-*`.

---

## 6. Flujos de usuario críticos

### Flow A — Dealer envía solicitud de crédito (wizard)

```mermaid
flowchart LR
  A[Dealer dashboard] --> B[+/Nueva solicitud]
  B --> C1[Step 1 Solicitante]
  C1 --> C2[Step 2 Co-firmante]
  C2 --> C3[Step 3 Vehículo]
  C3 --> C4[Step 4 Documentos]
  C4 --> C5[Step 5 Consentimiento]
  C5 --> D[POST create + process]
  D --> E[Complete page]
  E --> F[Dealer applications list]
```

| Step | Pantalla | Acción usuario | Transición estado |
|------|----------|----------------|-------------------|
| 0 | `/credit-hub/dealer` | Tap “Nueva solicitud” | → wizard |
| 1–5 | `/applications/new/{step}` | Fill fields, Guardar borrador (localStorage), Siguiente | Zod validation gates advance |
| 5 | Consent | OTP / WhatsApp / email / selfie | Consent captured in payload |
| Submit | Consent footer | Confirm envío | `POST /applications` → `POST …/process` → status `submitted`/`processing` |
| Done | `/applications/new/complete` | View confirmation | → list/detail |

**Design emphasis:** Mobile-first stepper, field-level errors, consent method cards, progress persistence, success celebration.

### Flow B — Bank analista revisa solicitud pendiente

| Step | Pantalla | Acción | API |
|------|----------|--------|-----|
| 1 | `/credit-hub/bank` or `/applications` | Scan queue, search | `GET …/queue` |
| 2 | `/applications/[id]` | Auto-claim on mount | `POST …/claim` |
| 3 | Detail tabs | Review analysis, documents | `GET …/applications/{id}` |
| 4 | — | Optional compliance check | `GET …/compliance/{id}` |
| 5 | Decision modal | Approve / Reject / Counter + justification | `POST …/decide` |

**Design emphasis:** Dense evidence layout, score visual hierarchy, decision terms editor, audit trail visibility, claim/conflict states (409).

### Flow C — Bank comité / bulk decision

| Step | Pantalla | Acción | API |
|------|----------|--------|-----|
| 1 | `/applications` | Select rows, pick rule | UI state |
| 2 | Bulk panel | Enter justification, confirm | `POST …/bulk-decide` |
| 3 | — | Toast + queue refresh | invalidate queries |

**Design emphasis:** Bulk bar must feel authoritative; clear preview of affected count; audit trail linkage.

### Flow D — Bank monitorea cartera (analytics)

| Step | Pantalla | Acción | API |
|------|----------|--------|-----|
| 1 | `/credit-hub/bank/analytics` | View KPIs, cohort charts | dashboard + dealers-ranking |
| 2 | — | Portfolio health bands | portfolio-health (**partial shape**) |
| 3 | Dashboard Insights | Volume / approval trend | **No API wired** — charts empty |

**Design emphasis:** Executive readability, cohort trends, dealer leaderboard, default prediction callout.

### Flow E — Dealer preaprobación → solicitud

| Step | Pantalla | Acción | API |
|------|----------|--------|-----|
| 1 | `/dealer/preapproval` | Adjust price/down payment/term | Local simulation |
| 2 | — | “Convertir a solicitud” | Navigate with `?preset=` base64 |
| 3 | Wizard | Pre-filled vehicle/finance fields | Client decode only |

**Design emphasis:** Simulator results clarity, amortization chart polish, handoff into wizard step 3.

---

## 7. Restricciones y constantes

### 7.1 Stack (fixed)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 App Router, TypeScript strict |
| Styling | Tailwind core utilities + Forge token classes (`text-forge-*`, `bg-forgeSurface-*`) |
| Icons | lucide-react |
| Charts | recharts (bank analytics, preapproval) |
| Motion | CSS only — no framer-motion in Forge (`lib/motion-stub.tsx`) |
| Toasts | Sonner via `ForgeToaster` in shell |

### 7.2 Design tokens

| Source | Prefix | Notes |
|--------|--------|-------|
| `styles/forge-tokens-v2.css` | `--forge-*` | Primary system; portal overrides via `[data-portal="bank"]` / `[data-portal="dealer"]` |
| `app/(forge)/credit-hub/forge-globals.css` | Forge Tailwind bridge | Imported in `CreditHubLayoutClient` |
| `app/market-intel/market-intel.css` | `--mee-*` | MEE amber `#B45309` — **reference palette for Credit Hub redesign** |
| `app/globals.css` | `--quantum-*` | Legacy dashboard chrome — **not** Credit Hub scoped |

**Credit Hub accent target:** amber aligned with MEE (`--mee-accent` / `--forge-accent` family). Design may introduce scoped `--ch-*` under `.credit-hub-forge` similar to `.market-intel-mee`.

### 7.3 Personas

| Persona | Rutas | Diseño |
|---------|-------|--------|
| **Bank** | `/credit-hub/bank/**` | Sobrio, denso, alta autoridad — tables, KPIs, audit/compliance |
| **Dealer** | `/credit-hub/dealer/**` | Rápido, operacional, mobile-friendly — wizard, bottom nav (dealer layout), large CTAs |
| **Ambos** | `/credit-hub` portal picker | Neutral entry |

### 7.4 Do NOT touch (engineering guardrails)

- Route paths under `/credit-hub/*`
- API endpoints and request/response contracts
- `useAuth()` / PR #128 tenant resolution
- Tenant feature flags and RLS headers (`X-Tenant-ID`, Bearer token)
- `CreditOrchestrator` / Super Agent contracts (backend)
- PersonaProvider segment seam (Phase 8) — Design works with current bank/dealer URL split

---

## 7. Recommendation: Bank vs Dealer vs single pass

| Option | Verdict |
|--------|---------|
| **Single Claude Design pass for entire Credit Hub** | **Not recommended** — ~39 URLs, two personas, wizard vs analyst workflows |
| **Package 1: Bank Portal** (6 hero routes + shell bank variant) | **Recommended first** — daily bank operator value; highest visibility gap vs MEE |
| **Package 2: Dealer Portal** (dashboard, list, detail, wizard 5 steps, preapproval) | **Recommended second** — distinct mobile/wizard patterns |
| **Package 0 (shared): Forge shell, tokens, sidebar/topbar** | Small prerequisite doc — `--ch-*` or `--mee-*` bridge, logo, command palette |

**Suggested sequence:** Shared tokens/shell (1–2 days) → Bank package → Dealer package. Reuse MEE patterns: KPI strip, section tabs, drawer detail, FiltersBar-style density controls, amber accent, institutional typography (Inter Tight + Newsreader optional for bank heroes).

---

## Appendix A — Endpoint quick reference

| Method | Path | Used by |
|--------|------|---------|
| GET | `/api/v2/auth/me` | Auth bootstrap |
| GET | `/api/v2/tenants/{slug}/branding` | Tenant config |
| GET | `/api/v2/credit/applications/queue` | Bank dashboard, list, audit, compliance |
| GET | `/api/v2/credit/applications/{id}` | Bank detail |
| POST | `/api/v2/credit/applications/{id}/claim` | Bank detail auto-claim |
| POST | `/api/v2/credit/applications/{id}/decide` | Bank decision |
| POST | `/api/v2/credit/applications/bulk-decide` | Bank bulk |
| GET | `/api/v2/credit/applications/{id}/counter-offer` | Bank counter |
| GET | `/api/v2/credit/applications/{id}/audit-trail` | Bank detail |
| GET | `/api/v2/credit/compliance/{id}` | Bank detail |
| POST | `/api/v2/credit/applications/{id}/compliance/approve` | Bank detail |
| GET | `/api/v2/credit/analytics/dashboard` | Bank dashboard, analytics |
| GET | `/api/v2/credit/analytics/dealers-ranking` | Analytics |
| GET | `/api/v2/credit/analytics/portfolio-health` | Analytics (**shape partial**) |
| GET | `/api/v2/credit/applications` | Dealer list |
| GET | `/api/v2/credit/stats` | Dealer dashboard |
| POST | `/api/v2/credit/applications` | Wizard create |
| POST | `/api/v2/credit/applications/{id}/process` | Wizard submit |
| GET | `/api/v2/credit/applications/{id}/events` | Dealer detail timeline |

## Appendix B — Related internal docs

- `app/(forge)/credit-hub/_design/PAGES.md` — hero page ASCII layouts
- `app/(forge)/credit-hub/_design/COMPONENTS.md` — Forge primitive contracts
- `app/(forge)/credit-hub/_design/_inventory/reusability-test/` — screenshot captures referenced above

---

*End of design brief. For questions on backend shapes marked partial/unknown, escalate to backend team before Design finalizes portfolio-health and audit field layouts.*
