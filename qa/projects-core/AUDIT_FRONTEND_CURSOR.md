# Frontend Code-Evidence Audit — Cursor

**Repo:** `nadakki-dashboard` (read-only audit).  
**Date:** 2026-05-22  
**Scope:** CAP-79 … CAP-95 (frontend), CAP-103 (UX por rol, **Projects-facing** interpretation).

---

## Context files (requested)

| File | Status |
|------|--------|
| `../nadakki-ai-suite/docs/architecture/projects-core/Nadakki_ProjectsCore_06_Roadmap_Matriz_Auditoria.md` | **Not available** — `nadakki-ai-suite` path not present on this machine (`Test-Path`; no sibling docs tree). Capability **titles/requirements per CAP row** therefore **not cross-checked**. |
| `../nadakki-ai-suite/docs/architecture/projects-core/Nadakki_ProjectsCore_02_API_Contract_v1_1.yaml` | **Not available** (same reason). Could not grep OpenAPI paths for Projects Core (`/projects`, etc.) against this YAML in-repo. |

**Method impact:** Rows below classify **against observable dashboard code**. Where the matrix defines a CAP as satisfied by reuse of non-`/proyectos` UI, reconcile manually when the matrix is available.

---

## Discovery commands run (effective equivalents via workspace tools)

- **Trees:** `**/app/proyectos/**`, `**/components/proyectos/**`, `**/hooks/**` scanned — **0 files** under `app/proyectos` or `components/proyectos`.
- **Substring:** Workspace search for `proyectos` across `nadakki-dashboard` — **0 matches** (`rg` / codebase search).
- **Related routes:** Legacy `Sidebar.tsx` includes SIC “Portafolio” → `/sic/portafolio`; that is **SIC/expedientes context**, **not** a Projects Core app tree (`components/layout/Sidebar.tsx`:113).

---

## 1. Summary table (CAP-79..CAP-95, CAP-103)

**Definitions:** BUILT (working UI/feature in codepath), SCAFFOLD (infra/patterns exist but Projects Core wiring absent), SPEC_ONLY (docs/types only — none found), MISSING (no code evidence).

Assumption pending matrix: CAP-79 … CAP-95 are **distinct Projects Core frontend deliverables**.

| CAP | State | Evidence (file:line or search result) |
|-----|-------|----------------------------------------|
| CAP-79 | **MISSING** | No route tree `app/proyectos/**`; workspace `grep` **`proyectos` → 0 hits**. |
| CAP-80 | **MISSING** | Same. |
| CAP-81 | **MISSING** | Same. |
| CAP-82 | **MISSING** | Same. |
| CAP-83 | **MISSING** | Same. |
| CAP-84 | **MISSING** | Same. |
| CAP-85 | **MISSING** | Same. |
| CAP-86 | **MISSING** | Same. |
| CAP-87 | **MISSING** | Same. |
| CAP-88 | **MISSING** | Same. |
| CAP-89 | **MISSING** | Same. |
| CAP-90 | **MISSING** | Same. |
| CAP-91 | **MISSING** | Same. |
| CAP-92 | **MISSING** | Same. |
| CAP-93 | **MISSING** | Same. |
| CAP-94 | **MISSING** | Same. |
| CAP-95 | **MISSING** | Same. |
| CAP-103 | **SCAFFOLD** | **Global** RBAC/per-role pattern exists (`hooks/useRBAC.ts`:5–29: cores `credit`, `legal`, `marketing`, `platform` **only** — **no `projects` core**, no Projects-specific permission map). Suitable to extend; **Projects Core UX por rol no implementado.** |

---

## 2. Existing reusable UI components/patterns discovered

**Forge institutional UI** (tailwind `forge*` tokens; cards, modal, tables, KPIs):

- `components/forge/ui/Card.tsx` — `Card`/`variant`/`forgeSurface`/`forgeGray` (e.g. `components/forge/ui/Card.tsx`:12–20).
- `components/forge/ui/Modal.tsx` — Forge modal primitive.
- `components/forge/ui/DataTable.tsx` — table pattern.
- `components/forge/ui/KpiCard.tsx`, `MicroChart.tsx`, `AuditTimeline.tsx`, `EvidenceCard.tsx` — KPI / timeline / charts.
- `components/forge/ui/Button.tsx`, `Input.tsx`, `Select.tsx`, `Tabs.tsx`, `Badge.tsx`, `EmptyState.tsx`, `Skeleton.tsx` — forms & states.
- Layout shells: `components/forge/layout/ForgeCreditHubAppShell.tsx`, `ForgeAppShell.tsx`, sidebars/topbars — **patterns for a new Projects area** under `/proyectos` or similar.

**Shared `components/ui`** (non-Forge / global):

- `components/ui/dialog.tsx` — Radix dialog (used elsewhere, e.g. bank flows).
- `components/ui/StatCard.tsx`, `Skeleton.tsx`, `Breadcrumbs.tsx`, `GlassCard.tsx`, `button.tsx`.

**Screens with rich patterns** (reuse reference, **not** Projects Core):

- **Credit Hub:** `components/forge/credit-hub/*`, `app/(forge)/credit-hub/**` — wizard, bank detail (`BankApplicationDetailView.tsx`).
- **Legal:** `hooks/legal/useLegalCases.ts` + `lib/legal/cases/legal-cases-api` — list + filters + React Query (`hooks/legal/useLegalCases.ts`:16–22).
- **SIC portfolio:** `/sic/portafolio`, `Sidebar` nav item (`components/layout/Sidebar.tsx`:113) — analytics/portfolio wording is **risk/SIC**, not Projects API.

---

## 3. Existing API consumption pattern (how to wire Projects frontend)

**1) Same-origin rewrites**

- `next.config.js` proxies many `/api/...` paths to backend (`next.config.js`:27–64). Example: `{ source: "/api/v2/credit/:path*", destination: `${backendUrl}/api/v2/credit/:path*` }` (**line**:54).

**2) Dedicated API module classes**

Example **Credit Core** client: `lib/credit-hub/api/creditCoreClient.ts`:

- Base path constant `CREDIT_CORE_BASE = "/api/v2/credit"` (`creditCoreClient.ts`:14).
- Fetch wrapper injects **`X-Tenant-ID`**, JSON, timeouts, typed errors (**lines**:57–71).

**3) Thin API functions + React Query hooks**

- Hooks: `lib/credit-hub/hooks/useApplications.ts`:

  - `useQuery` + `queryKey` via `chKeys` (`useApplications.ts`:13–20).
  - `queryFn` calls `listApplications(...)` (`useApplications.ts`:15–18).

- Key factory: `lib/credit-hub/hooks/queryKeys.ts` (whole file — namespaces like `credit-hub`, `applications`, tenant id).

- **Legal** parallel: `hooks/legal/useLegalCases.ts`: `useQuery` + `fetchCasesList` (`useLegalCases.ts`:16–22).

**Recommendation for Projects:** add `lib/projects/` (or `lib/projects-core/`) **fetch helpers** targeting paths from **`Nadakki_ProjectsCore_02_API_Contract_v1_1.yaml`**, plus `hooks/projects/useProject*` with `queryKeys.projects(...)`, mirror `credit-hub` layering.

**4) Evidence of absence**

- Repo search for `/api/.*project` patterns in `.ts`/`.tsx` yielded **no** dedicated Projects-core client snippet in this audit pass (beyond unrelated “portfolio” SIC/marketing wording).

---

## 4. Existing theme/design system (institutional alignment)

**Tailwind institutional tokens:**

- `tailwind.config.js` extends `forgeBrand`, `forgeGray`, `forgeSurface`, status colors, and **legacy Forge aliases** (see `tailwind.config.js`:48–100+).

**CSS variables / Forge v2:**

- `styles/forge-tokens-v2.css`, `styles/forge-tokens.css` imported/used alongside portal `.forge-app` (referenced in tailwind comments, `tailwind.config.js`:48–52).

**Global marketing-style variables (non-Forge):**

- `app/globals.css`: `:root` quantum/glass palette (`app/globals.css`:12–26) — coexist with Forge areas; Projects pages should **prefer Forge tokens** (`forgeBrand`, `forgeGray`, components under `components/forge/ui`) for institutional parity with Credit Hub.

**Credit-hub portal stylesheet:**

- `app/(forge)/credit-hub/forge-globals.css` — pattern for scoped theme under a route group.

---

## 5. Build roadmap for MISSING frontend items (ordered, complexity)

Assumes matrix maps CAP-79..95 to sequential UI slices; adjust order once YAML/matrix are available.

| # | Item | Complexity |
|---|------|-------------|
| 1 | Merge matrix + OpenAPI locally; add `/api/v2/...` rewrites if missing (`next.config.js`) | **S** |
| 2 | Scaffold `app/proyectos/` (or routed name per product) + `layout.tsx`; register in active nav (not deprecated `Sidebar.tsx` only — follow `DashboardLayout`/AppGate) | **M** |
| 3 | `lib/projects-core/` client + typed DTOs from OpenAPI; `hooks/projects/` + `queryKeys` | **M** |
| 4 | List/dashboard views using `ForgeAppShell` + `DataTable` + `KpiCard` | **M** |
| 5 | Detail/drawers/modals (`Modal`, `Drawer`) per CAP drill-downs | **L** |
| 6 | Role-based visibility: extend **`useRBAC`** or tenant module flags with **`projects` core** in `ROLE_PERMS` (**CAP-103**) | **M** |
| 7 | Charts / timeline where matrix requires (`MicroChart`, `AuditTimeline`) | **S–M** |
| 8 | E2E + contract tests vs backend | **L** |

---

## 6. Final tally

| Classification | Count (CAP-79–95 + CAP-103) |
|----------------|----------------------------|
| **BUILT** | **0** |
| **SCAFFOLD** | **1** (CAP-103 — global RBAC hooks without `projects` core) |
| **SPEC_ONLY** | **0** |
| **MISSING** | **17** (CAP-79 … CAP-95 — no Projects-specific frontend surface found) |

**Note:** Recount against matrix if any CAP maps to existing `/sic/portafolio` or other screens.

---

AUDIT-FRONTEND-CURSOR STATUS: done — BUILT=0 SCAFFOLD=1 SPEC_ONLY=0 MISSING=17
