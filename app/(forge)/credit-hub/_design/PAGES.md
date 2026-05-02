# Forge Credit Hub — hero pages

English technical reference. Each **hero** route below is the primary operator surface for demos, Lighthouse gates, and Phase 6 reusability captures. Cross-links use GitHub-style anchors on [`COMPONENTS.md`](./COMPONENTS.md).

---

## Bank — dashboard (`/credit-hub/bank`)

| | |
|--|--|
| **Route** | `/credit-hub/bank` |
| **File** | `app/(forge)/credit-hub/bank/page.tsx` |
| **Persona** | Bank |

### Layout (ASCII)

```text
┌──────────────────────────────────────────────────────────────┐
│ ForgeCreditHubAppShell (sidebar │ topbar)                   │
├──────────────┬───────────────────────────────────────────────┤
│ Sidebar      │ KPI row (KpiCard ×3)                          │
│ nav          ├───────────────────────────────────────────────┤
│              │ Queue filters + DataTable / EmptyState        │
└──────────────┴───────────────────────────────────────────────┘
```

### Components (see COMPONENTS.md)

[`KpiCard`](./COMPONENTS.md#kpicard), [`DataTable`](./COMPONENTS.md#datatable), [`EmptyState`](./COMPONENTS.md#emptystate), [`Button`](./COMPONENTS.md#button), [`Badge`](./COMPONENTS.md#badge), [`StatusPill`](./COMPONENTS.md#statuspill), [`Input`](./COMPONENTS.md#input), [`Card`](./COMPONENTS.md#card), [`Skeleton`](./COMPONENTS.md#skeleton).

### Hooks

[`useTenantConfig`](../../../../lib/credit-hub/hooks/useTenantConfig.ts), [`useBankQueue`](../../../../lib/credit-hub/hooks/useBankQueue.ts), [`useBankAnalytics`](../../../../lib/credit-hub/hooks/useBankAnalytics.ts), [`useTranslations`](../../../../lib/credit-hub/i18n/useTranslations.ts).

### Tenant-aware

Currency / locale via `useTenantConfig().tenantConfig` + `formatForgeCurrency`; empty copy via `forgeEmptyCopy` (`utils/forge-empty-copy.ts`).

### Empty / error / mobile

- **Empty:** filter-empty vs zero-queue vs error — `EmptyState` + CTAs per [`POLISH.md`](./POLISH.md) Item 4.
- **Error:** API failure surfaces banner + retry affordance in-page.
- **Mobile:** tables use `DataTable` density + horizontal scroll inside wrapper ([`COMPONENTS.md#datatable`](./COMPONENTS.md#datatable)).

### Screenshots

- Desktop: [`./_assets/pages/bank/dashboard-desktop.png`](./_assets/pages/bank/dashboard-desktop.png)
- Mobile: [`./_assets/pages/bank/dashboard-mobile.png`](./_assets/pages/bank/dashboard-mobile.png)
- _(Phase 6 reuse where noted in `tools/docs/_capture-report.json`.)_

### Common modifications

Forward reference: [`HOW_TO_MODIFY.md`](./HOW_TO_MODIFY.md) — Recipes 4 (columns), 10 (tenant feature flags).

---

## Bank — applications list (`/credit-hub/bank/applications`)

| | |
|--|--|
| **Route** | `/credit-hub/bank/applications` |
| **File** | `app/(forge)/credit-hub/bank/applications/page.tsx` |
| **Persona** | Bank |

### Layout (ASCII)

```text
┌ Shell ────────────────────────────────────────────────────────┐
│ Page header + URL-synced search (`q`, `status`, `density`)    │
│ DataTable (queue rows, sort, bulk strip pattern at page lvl) │
└───────────────────────────────────────────────────────────────┘
```

### Components

[`DataTable`](./COMPONENTS.md#datatable), [`Button`](./COMPONENTS.md#button), [`Input`](./COMPONENTS.md#input), [`Select`](./COMPONENTS.md#select), [`EmptyState`](./COMPONENTS.md#emptystate), [`Badge`](./COMPONENTS.md#badge).

### Hooks

[`useBankQueue`](../../../../lib/credit-hub/hooks/useBankQueue.ts), [`useBulkActions`](../../../../lib/credit-hub/hooks/useBulkActions.ts), [`useTenantConfig`](../../../../lib/credit-hub/hooks/useTenantConfig.ts), [`useTranslations`](../../../../lib/credit-hub/i18n/useTranslations.ts).

### Tenant-aware

Locale for table copy; currency in amount columns when present.

### Empty / error / mobile

URL-driven filters; `EmptyState` for zero rows vs filter-empty ([`POLISH.md` Item 1](./POLISH.md)). Mobile: density + `overflow-x-auto`.

### Screenshots

[`./_assets/pages/bank/applications-list-desktop.png`](./_assets/pages/bank/applications-list-desktop.png) · [`./_assets/pages/bank/applications-list-mobile.png`](./_assets/pages/bank/applications-list-mobile.png)

---

## Bank — application detail (`/credit-hub/bank/applications/[applicationId]`)

| | |
|--|--|
| **Route** | `/credit-hub/bank/applications/APP-1847` (example id) |
| **File** | `app/(forge)/credit-hub/bank/applications/[applicationId]/page.tsx` |
| **Persona** | Bank |

### Layout (ASCII)

```text
┌ Shell ────────────────────────────────────────────────────────┐
│ BankApplicationDetailView (tabs: summary / docs / AI / …)       │
│  ├─ Tabs, EvidenceCard, DataTable, Modal, Drawer               │
│  └─ BankDecisionPanel (Button loading states)                  │
└───────────────────────────────────────────────────────────────┘
```

### Components

[`Tabs`](./COMPONENTS.md#tabs), [`EvidenceCard`](./COMPONENTS.md#evidencecard), [`DataTable`](./COMPONENTS.md#datatable), [`Modal`](./COMPONENTS.md#modal), [`Drawer`](./COMPONENTS.md#drawer), [`Button`](./COMPONENTS.md#button), [`StatusPill`](./COMPONENTS.md#statuspill), [`EmptyState`](./COMPONENTS.md#emptystate).

### Hooks

[`useApplication`](../../../../lib/credit-hub/hooks/useApplication.ts), [`useBankDecision`](../../../../lib/credit-hub/hooks/useBankDecision.ts), [`useTenantConfig`](../../../../lib/credit-hub/hooks/useTenantConfig.ts).

### Tenant-aware

Decision copy + toast strings via tenant locale modules (`utils/forge-toast-copy.ts`).

### Empty / error / mobile

Per-tab empty states (documents, AI pending, audit) per POLISH Item 4. Decision errors → `toast.error`.

### Screenshots

[`./_assets/pages/bank/application-detail-desktop.png`](./_assets/pages/bank/application-detail-desktop.png) · [`./_assets/pages/bank/application-detail-mobile.png`](./_assets/pages/bank/application-detail-mobile.png)

### Common modifications

[`HOW_TO_MODIFY.md`](./HOW_TO_MODIFY.md) Recipe 5 (new tab), Recipe 6 (EvidenceCard).

---

## Bank — audit (`/credit-hub/bank/audit`)

| | |
|--|--|
| **Route** | `/credit-hub/bank/audit` |
| **File** | `app/(forge)/credit-hub/bank/audit/page.tsx` |
| **Persona** | Bank |

### Layout (ASCII)

```text
┌ Shell ─────────────────────────────┐
│ Filters + AuditTimeline / Empty    │
└────────────────────────────────────┘
```

### Components

[`AuditTimeline`](./COMPONENTS.md#audittimeline), [`EmptyState`](./COMPONENTS.md#emptystate), [`Input`](./COMPONENTS.md#input), [`Button`](./COMPONENTS.md#button).

### Hooks

Tenant + audit data hooks under `lib/credit-hub/hooks/` (see page source imports).

### Screenshots

[`./_assets/pages/bank/audit-desktop.png`](./_assets/pages/bank/audit-desktop.png) · [`./_assets/pages/bank/audit-mobile.png`](./_assets/pages/bank/audit-mobile.png)

---

## Bank — compliance (`/credit-hub/bank/compliance`)

| | |
|--|--|
| **Route** | `/credit-hub/bank/compliance` |
| **File** | `app/(forge)/credit-hub/bank/compliance/page.tsx` |
| **Persona** | Bank |

### Layout (ASCII)

```text
┌ Shell ─────────────────────────────┐
│ Alerts grid + EmptyState success  │
└────────────────────────────────────┘
```

### Components

[`EmptyState`](./COMPONENTS.md#emptystate) (`tone="success"` when clear), [`Card`](./COMPONENTS.md#card), [`Badge`](./COMPONENTS.md#badge).

### Screenshots

[`./_assets/pages/bank/compliance-desktop.png`](./_assets/pages/bank/compliance-desktop.png) · [`./_assets/pages/bank/compliance-mobile.png`](./_assets/pages/bank/compliance-mobile.png)

---

## Dealer — dashboard (`/credit-hub/dealer`)

| | |
|--|--|
| **Route** | `/credit-hub/dealer` |
| **File** | `app/(forge)/credit-hub/dealer/page.tsx` |
| **Persona** | Dealer |

### Layout (ASCII)

```text
┌ Shell ────────────────────────────────────────────┐
│ KPI / pipeline cards + EmptyState for zero pipeline │
└──────────────────────────────────────────────────────┘
```

### Components

[`KpiCard`](./COMPONENTS.md#kpicard), [`Card`](./COMPONENTS.md#card), [`EmptyState`](./COMPONENTS.md#emptystate), [`Button`](./COMPONENTS.md#button).

### Hooks

Dealer stats / applications hooks — see `dealer/page.tsx` imports.

### Screenshots

[`./_assets/pages/dealer/dashboard-desktop.png`](./_assets/pages/dealer/dashboard-desktop.png) · [`./_assets/pages/dealer/dashboard-mobile.png`](./_assets/pages/dealer/dashboard-mobile.png)

---

## Dealer — applications list (`/credit-hub/dealer/applications`)

| | |
|--|--|
| **Route** | `/credit-hub/dealer/applications` |
| **File** | `app/(forge)/credit-hub/dealer/applications/page.tsx` |
| **Persona** | Dealer |

### Components

[`DataTable`](./COMPONENTS.md#datatable), `components/credit-hub/system/PullToRefresh.tsx` _(legacy, not in COMPONENTS catalog — Phase 7.2 Case B)_, [`EmptyState`](./COMPONENTS.md#emptystate), [`Button`](./COMPONENTS.md#button).

### Hooks

[`useCreditApplications`](../../../../lib/credit-hub/hooks/useCreditApplications.ts) (or equivalent dealer list hook — verify imports in page file).

### Screenshots

[`./_assets/pages/dealer/applications-list-desktop.png`](./_assets/pages/dealer/applications-list-desktop.png) · [`./_assets/pages/dealer/applications-list-mobile.png`](./_assets/pages/dealer/applications-list-mobile.png)

---

## Dealer — application detail (`/credit-hub/dealer/applications/[applicationId]`)

| | |
|--|--|
| **Route** | `/credit-hub/dealer/applications/APP-1847` |
| **File** | `app/(forge)/credit-hub/dealer/applications/[applicationId]/page.tsx` |
| **Persona** | Dealer |

### Components

Forge + legacy composition — follow page imports; primary primitives mirror bank detail where shared.

### Screenshots

[`./_assets/pages/dealer/application-detail-desktop.png`](./_assets/pages/dealer/application-detail-desktop.png) · [`./_assets/pages/dealer/application-detail-mobile.png`](./_assets/pages/dealer/application-detail-mobile.png)

---

## Dealer — wizard step 1 (`/credit-hub/dealer/applications/new/applicant`)

| | |
|--|--|
| **Route** | `/credit-hub/dealer/applications/new/applicant` |
| **File** | `app/(forge)/credit-hub/dealer/applications/new/applicant/page.tsx` |
| **Persona** | Dealer |

### Layout (ASCII)

```text
┌ Shell ─────────────────────────────────────────────┐
│ Wizard chrome (progress) + step form (Input, …)    │
│ Fixed footer primary (Button)                     │
└────────────────────────────────────────────────────┘
```

### Components

[`Input`](./COMPONENTS.md#input), [`Select`](./COMPONENTS.md#select), [`Button`](./COMPONENTS.md#button), [`ConsentCapture`](./COMPONENTS.md#consentcapture) on later steps.

### Hooks

Wizard provider + draft persistence — `components/forge/credit-hub/dealer/wizard/*` (see [`MIGRATION.md`](./MIGRATION.md) dealer wizard notes).

### Screenshots

[`./_assets/pages/dealer/wizard-step1-desktop.png`](./_assets/pages/dealer/wizard-step1-desktop.png) · [`./_assets/pages/dealer/wizard-step1-mobile.png`](./_assets/pages/dealer/wizard-step1-mobile.png)

### Common modifications

[`HOW_TO_MODIFY.md`](./HOW_TO_MODIFY.md) Recipe 8 (wizard step count).

---

## Preview playground (`/credit-hub/preview`)

| | |
|--|--|
| **Route** | `/credit-hub/preview` |
| **File** | `app/(forge)/credit-hub/preview/page.tsx` |
| **Persona** | Both (design QA) |

Canonical primitive matrix for capture scripts and Lighthouse smoke. Not a production persona route — see [`COMPONENTS.md#preview-playground`](./COMPONENTS.md#preview-playground).

---

## Related

- [`README.md`](./README.md) · [`TOKENS.md`](./TOKENS.md) · [`POLISH.md`](./POLISH.md) · [`MIGRATION.md`](./MIGRATION.md)
