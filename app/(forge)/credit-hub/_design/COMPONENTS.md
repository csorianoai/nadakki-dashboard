# Forge Credit Hub — components

## Barrel

App code imports from `@/components/forge` (see `components/forge/index.ts`).

## Phase 2 primitives (28 exports)

Presentational building blocks under `components/forge/ui/*` (and generic `layout/Sidebar`, `layout/Topbar` for previews):

Button, IconButton, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Card, EmptyState (optional **`icon`**, **`tone="success"`** for passive positive framing), Badge, StatusPill, Skeleton, Avatar, Modal, Drawer, Toast (`ForgeToaster` + `toast`), Tabs, Breadcrumb, DataTable, KpiCard, EvidenceCard, AuditTimeline, CommandPalette, MoneyInput, DateInput, ConsentCapture.

These primitives are **persona-agnostic** (no `usePersona` / no layout segments).

### DataTable — mobile strategy

**Mobile strategy:** use **`density="compact"`** (or `dense`) plus **`overflow-x-auto`** on the table wrapper and **`min-w-0`** on text-heavy cells so small viewports scroll horizontally **inside** the table instead of breaking the page layout. Chunk 3 mobile screenshots (iPhone SE) confirmed no horizontal page scroll on dealer surfaces.

The master prompt originally suggested a separate **`<DataTableMobileCard>`** component for card-based mobile rows. That component **was not built**: the **density + scroll** approach was sufficient for dealer/bank table UX, and a density toggle preserves a real table on tablets where bankers and dealers often want columns. If a future tenant requires **cards-not-tables** on mobile, introduce `DataTableMobileCard` (or a `variant="cards"` on `DataTable`) then — the API surface is already considered.

### Button & IconButton (Phase 5 polish)

- **`Button` loading:** Inline spinner is **leading** (left of the label), never replacing the label. Matches common fintech defaults (Stripe / Linear). `aria-busy="true"` while `loading` is set; the element is `disabled` during loading to prevent double-submit.
- **`Button` disabled vs loading:** `disabled` alone → muted ink/surface (no spinner). `loading` → variant colors + leading spinner + `aria-busy`. If both props are true, **loading UI wins** (spinner + busy + frozen variant colors); callers should prefer **`loading` only** during submission instead of also forcing `disabled`.
- **`IconButton`:** `aria-label` is **required in TypeScript** on the primitive. Missing labels at call sites are bugs to fix in app code, not by loosening the primitive.
- **Focus ring:** `focus-visible:outline` **2px** `forgeBrand-500` + **2px** offset on both primitives. On very dark brand chrome, if the ring ever fails WCAG focus-indicator contrast against adjacent pixels, consider `forgeBrand-300` for that surface or a double-ring treatment — validate in `/credit-hub/preview` “Focus on surfaces” swatches before changing tokens.

### DataTable

- **Empty:** Zero rows render **`<EmptyState>`** inside the table (not a bare “no data” text row). Pass **`emptyDescription`** / **`emptyAction`** when you need copy + CTA beyond **`emptyLabel`**. Optional **`emptyIcon`** (decorative) and **`emptyTone="success"`** for positive “all clear” grids (Item 4).
- **Loading:** Set **`loading`** to show a skeleton **body** with the same column count as **`columns`** (use **`skeletonRowCount`** to tune height). The wrapper sets **`aria-busy`**.
- **Sort (optional):** If a column defines **`onSort`**, the header is a button with **`aria-sort`** reflecting **`sort`** (`ascending` | `descending` | `none`). Icons are decorative (`aria-hidden`).
- **Rows:** Body rows use a **subtle hover** background only (no transform / layout shift).

### Navigation — Tabs, Breadcrumb, CommandPalette (`layout/Sidebar`, `layout/Topbar`)

- **`Tabs` (`line`):** Active indicator **`border-forgeBrand-500`**; inactive baseline uses **`border-forgeInk-200`** (not a fully invisible underline) so the tab bar reads as a structured control strip.
- **`CommandPalette`:** **`closeOnBackdropClick`** (default `true`) mirrors Modal/Drawer backdrop policy for audits that need a non-dismissible surface. Supports **`groups`** (cmdk `Command.Group`), optional **controlled `search` / `onSearchChange`** for dynamic first-class rows (e.g. “search applications for …”), custom **`emptyMessage`** when filtering yields no commands, and **`keyboardShortcut={false}`** when **`ForgeCommandPaletteProvider`** owns **Ctrl+K / ⌘K** globally.
- **`ForgeCommandPaletteProvider`** (`components/forge/layout/ForgeCommandPaletteContext.tsx`): mounted inside **`ForgeCreditHubAppShell`**; registers **Ctrl+K / ⌘K**, restores focus after close, and renders **`ForgeCreditHubCommandPalette`** (persona-aware navigation, table-density deep links to **`/credit-hub/{persona}/applications?density=`**, AML/compliance shortcut, **“Switch institution (coming soon)”** dormant row, keyboard-shortcuts **Modal**). **`ForgeCreditHubTopbar`** adds a search **`IconButton`** calling **`useForgeCommandPalette().toggle`**. Labels use **`utils/forge-palette-copy.ts`** (EN/ES). **Telemetry:** none in repo — skipped.
- **`Topbar`:** **`actions`** slot carries global chrome (e.g. command palette) — compose **`Button`** / **`IconButton`** only (Group 2 sweep applies).

### Overlays — Modal, Drawer, Toast

- **`Modal` / `Drawer`:** **`closeOnBackdropClick`** (default `true`) — set `false` for non-dismissible flows (still use **`Esc`** / explicit close affordances). **`Modal`** uses native **`<dialog>`** light-dismiss when clicking the dialog element itself (backdrop hit target).
- **`ForgeToaster` (Sonner):** Toast surface includes **`motion-reduce:transition-none`** / **`motion-reduce:animate-none`** so auto-dismiss does not rely on motion for comprehension.
- **Mount policy (Item 3):** **`ForgeToaster`** is mounted **once** in **`ForgeCreditHubAppShell`** (all `/credit-hub/*` Forge routes). Legacy **`/credit/*`** routes that still use **`DocumentUploader`** mount a **separate** **`CreditForgeToaster`** in **`app/credit/layout.tsx`** so Sonner is available without duplicating per page. Do **not** add another `<ForgeToaster />` on individual pages under those shells.
- **Sonner options:** **`position="top-right"`**, **`visibleToasts={3}`**, per-call **`duration`** from callers (`toast.success(msg, { duration: … })`).
- **Dealer wizard autosave toasts:** Background **localStorage** autosave (10s) shows **at most one** subtle **info** success toast **per browser session** (`sessionStorage` gate); subsequent successful saves are **silent** (institutional preference for silent success over repeated affirmation). Autosave **failure** uses **`toast.warning`** with a **“Reintentar”** / **“Retry”** action that runs a manual save. Copy + EN/ES split lives in **`utils/forge-toast-copy.ts`** (`forgeWizardToasts`), keyed off **`useTenantConfig().tenantConfig.locale`** (Forge) or **`TenantSettings.language`** (legacy uploader) via **`forgeToastLangFromLocale`**. Bank decision + legacy document upload strings use the same helper module.

## Preview playground

**Canonical URL:** `/credit-hub/preview`

Static route: `app/(forge)/credit-hub/preview/page.tsx`.  
Next.js treats leading-underscore segments as **private folders**, so the playground is **not** under `_design/preview` in the filesystem; use the URL above in docs and links.

## App shell (Phase 3)

- **`ForgeCreditHubAppShell`** (`components/forge/layout/ForgeCreditHubAppShell.tsx`) wraps Credit Hub in `app/(forge)/credit-hub/layout.tsx`: sidebar, top bar, tenant guard, `data-portal` + **`data-tenant`** (from `useTenant` in `lib/credit-hub/hooks/useTenant.ts`).
- **`ForgeCreditHubSidebar`** / **`ForgeCreditHubTopbar`** consume **`usePersona()`** and **`TenantContext`** / i18n for labels — they **do not** import `useSelectedLayoutSegments`.

### Persona contract (Phase 8 refactor scope)

**Rule:** Every Forge file under `components/forge/ui/*` and every persona-aware layout module under `components/forge/layout/*` except the shell seam must consume **`usePersona()`** — **not** `useSelectedLayoutSegments()` directly.

**Single seam today:** `creditHubPersonaFromLayoutSegments.ts` is the **only** module that reads layout segments; it is called from **`ForgeCreditHubAppShell`** solely to **seed** `PersonaProvider`. Replacing that seam in Phase 8 is a **small, localized** change (swap segment resolver for tenant-driven persona feeding the same `PersonaProvider`).

### DEFERRED TO PHASE 8 — URL-derived persona (accepted debt)

**Current implementation:** Persona (`bank` | `dealer`) fed to `PersonaProvider` is derived from **`useSelectedLayoutSegments()`** via **`creditHubPersonaFromLayoutSegments()`**, keyed off the first route segment under `/credit-hub` (`bank` / `dealer`). This **does not** meet the stricter “no URL-derived persona” guardrail from the Phase 3 brief.

**Target implementation:** Derive persona from **`TenantContext`** (and/or auth-derived role metadata) once Path A/B decisions allow extending tenant metadata **without** breaking other cores — see `TENANT_CONTEXT_EXTENSION.md` (ForgeBrandingProvider / Path B).

**Why deferred:** Correct fix requires coordinated **`TenantContext`** / Forge provider work — **explicitly Phase 8** territory; **`TenantContext.tsx` and `lib/credit-hub/hooks/useTenant.ts` remain unchanged** in Phases 2–4 per guardrails.

**Refactor scope:** Downstream components already use **`usePersona()`**; Phase 8 replaces **only** how `PersonaProvider` gets its `persona` prop (today: `ForgeCreditHubAppShell` + segment helper).

**Acceptance (Phase 8):** Phase 8 acceptance criteria will include **removing segment-based persona** in favor of tenant-driven (or role-driven) resolution, with regression checks on bank/dealer nav and `data-portal` styling.

**Interim risk acceptance:** URL ↔ persona alignment matches current folder layout (`bank/*`, `dealer/*`); no security boundary relies on persona today (server enforces `tenant_id` + JWT role).

## Lighthouse accessibility (Phase 4 gate)

**Gate hygiene (local / Windows — avoid false `__next_error__` shells):** Before a Lighthouse run that **gates** a merge or a phase sign-off, **stop every** local `next start` / `next dev` bound to the ports you use for audits (e.g. `3000`, `3010`, `3012`, `3013`, `3015`), **delete `.next`**, run **`npx next build --webpack`**, then start **exactly one** fresh **`npx next start -p <port>`** for the audit. Stale bundles or **two servers** on different ports can leave `curl` looking healthy while a headless run briefly hits a torn-down or half-updated process — symptoms match **`html#__next_error__`** in the saved JSON. If that selector appears, **discard the JSON**, clean as above, and re-run (see `_design/_inventory/lh_error_shell_diagnosis.md`).

**Canonical verification:** run against a **fresh** production build so HTML matches `app/layout.tsx` (viewport, lang) and client chunks are current:

```bash
npx next build --webpack
npx next start -p 3010
```

Then audit, for example:

```bash
npx lighthouse "http://localhost:3010/credit-hub/bank" --only-categories=accessibility --output=json --output-path="app/(forge)/credit-hub/_design/_inventory/lh-bank-dashboard-a11y.json"
```

**Why not only `next dev`:** a long-lived dev server can serve **stale** inlined viewport metadata after a root layout change; if Lighthouse still flags `meta-viewport` or misses heading fixes, restart dev or use `next start` as above.

### Windows: Lighthouse CLI and `chrome-launcher` (`EPERM` on temp cleanup)

On some Windows installs, `npx lighthouse` fails after the run with **`EPERM`** while `chrome-launcher` deletes its temp profile (`rmSync` on `%TEMP%\lighthouse.*`). The audit may still complete; if it does not, try **one** of these (in order of convenience):

1. **Pinned user data dir + project temp (recommended on Windows):** `chrome-launcher` also creates a throwaway profile under `%TEMP%` (or `.tmp\lighthouse.*` under the repo). If cleanup hits **`EPERM`**, point **`TMP` and `TEMP`** at a project folder you own, and pin Chromium’s profile:

   ```powershell
   New-Item -ItemType Directory -Force -Path ".\tmp\lh-chrome-profile",".\tmp\lh-tmp" | Out-Null
   $env:TEMP = (Resolve-Path ".\tmp\lh-tmp").Path
   $env:TMP = $env:TEMP
   $ud = (Resolve-Path ".\tmp\lh-chrome-profile").Path
   npx lighthouse "http://localhost:3012/credit-hub/dealer/applications/new/applicant" `
     --only-categories=accessibility --output=json `
     --output-path="app/(forge)/credit-hub/_design/_inventory/lh-dealer-applications-new-a11y.json" `
     --chrome-flags="--user-data-dir=$ud"
   ```

   If a second run still fails on `rmSync` of `lighthouse.*` under that folder (file still locked), wait a few seconds or use a **new** `.\tmp\lh-tmp-2` for `TEMP`/`TMP` for the next command.

   Use a **fresh** `next build --webpack` + `next start` first (same SOP as above).

2. **`--quiet` / logging:** some environments report fewer launcher races with `--quiet` (optional).

3. **Manual DevTools:** open the URL in Chrome → **Lighthouse** panel → Accessibility → **Analyze page load** → **Save as JSON** (or export) into the same `_design/_inventory/` filenames. This satisfies the Phase 4 gate when CLI is blocked locally.

4. **CI as canonical gate:** Linux CI agents typically do not hit this `EPERM`; keep Lighthouse in CI for regression if local Windows remains flaky.

**If none of the above work:** document the limitation in this section and rely on **CI + manual DevTools JSON** for evidence; do not block merges on a single machine’s launcher policy alone.

**Forge-specific fixes in tree:** root viewport allows zoom (`maximumScale: 5`); Credit Hub shell uses a **`<main id="main-content">`** landmark; sidebar and inline table actions meet **target-size**; `EmptyState` supports **`titleLevel`** so empty bands under an `h1` can use an **`h2`** title (heading order).

**Artifacts:** decoded final screenshots and full JSON live under `app/(forge)/credit-hub/_design/_inventory/` (see `INVESTIGATION_phase4_chunk1_gates.md`).

**Bank application detail (`/credit-hub/bank/applications/[applicationId]`):** a prior **HTTP 500** during document load led to a temporary **full-route** `next/dynamic(..., { ssr: false })` workaround. **SSR investigation** (`_design/_inventory/ssr_root_cause_phase4_detail.md`) showed a **clean `next build` + fresh `next start`** returns **200** with a **direct** import of `BankApplicationDetailView` — no `ssr: false` required on current `framer-motion` usage (`ScoreVisual`, `CreditAnalysisPanel`). If a 500 reappears, capture **server stderr** and treat as **CAT E** (stale `.next` / old server process) until a stack trace proves a library (**CAT A/D**). First narrowing step if `framer-motion` is proven: dynamic-import **only** `ScoreVisual`, not the whole review tree.
