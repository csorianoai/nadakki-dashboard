# Forge Credit Hub — components

## Barrel

App code imports from `@/components/forge` (see `components/forge/index.ts`).

## Phase 2 primitives (28 exports)

Presentational building blocks under `components/forge/ui/*` (and generic `layout/Sidebar`, `layout/Topbar` for previews):

Button, IconButton, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Card, EmptyState, Badge, StatusPill, Skeleton, Avatar, Modal, Drawer, Toast (`ForgeToaster` + `toast`), Tabs, Breadcrumb, DataTable, KpiCard, EvidenceCard, AuditTimeline, CommandPalette, MoneyInput, DateInput, ConsentCapture.

These primitives are **persona-agnostic** (no `usePersona` / no layout segments).

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
