# Phase 5 — polish tracker (Forge Credit Hub)

Status: `todo` | `done` | `deferred-phase-7` | **green**

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| **1** | Dealer `/credit-hub/dealer/applications` list — Forge primitives, URL `q` / `status` / `density`, DataTable + density, PullToRefresh kept | **green** | Lighthouse a11y **1.0** — `lh-dealer-applications-list-a11y.json`; diagnosis `lh_error_shell_diagnosis.md` |
| **2** | Hover / focus / disabled / loading sweep — `components/forge/ui/*` + layout | in progress | Groups **1–4** **green** — see Group 4 below; Group **5** next |
| **3** | Toast wiring (bank detail, wizard autosave, consent, uploads) | todo | Sonner primitive |
| **4** | Empty states sweep (bank + dealer zero-data surfaces) | todo | Icons + CTAs per Appendix A |
| **5** | CommandPalette wiring (Cmd+K, routes, density, sign out) | todo | cmdk |
| **Tenant coupling** | Hardcoded tenant copy/colors/currency (Phase 6 prep) | todo | Log leaks here when found |

---

## Phase 7 — eliminate `framer-motion` from runtime (DECIDED)

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 7 Item — Eliminate framer-motion from runtime         │
│ ──────────────────────────────────────────────────────────  │
│ Status: DECIDED, scheduled for Phase 7                      │
│ Decided by: Cesar (Phase 5 Item 1 follow-up)                │
│ Decided on: 2026-05-01                                      │
│                                                             │
│ Scope:                                                      │
│   1. Rewrite PullToRefresh with CSS-only motion             │
│      (transform translateY + transition, no JS animation    │
│      library)                                               │
│   2. Grep entire repo for any other framer-motion import;   │
│      rewrite each in CSS                                    │
│   3. npm uninstall framer-motion                            │
│   4. Verify bundle size delta in npm run build output       │
│   5. Document in DESIGN_SYSTEM.md as architectural rule     │
│      ("This product does not use a JavaScript animation     │
│      library. Motion is CSS transitions + Web Animations    │
│      API only.")                                            │
│                                                             │
│ Why structural, not conventional:                           │
│   The top 0.1% of fintech UI (Goldman Marquee, Stripe,      │
│   Linear, Brex, Bloomberg) ships without JS animation       │
│   libraries. Motion is CSS transitions + Web Animations     │
│   API only. While framer-motion exists in node_modules,     │
│   someone will eventually use it for decoration and erode   │
│   the "motion functional only" principle by attrition.      │
│   Removing the dep makes discipline structural rather       │
│   than convention-only.                                     │
│                                                             │
│ DO NOT execute in Phase 5. Phase 6 (reusability test)       │
│ must run against the current PullToRefresh implementation   │
│ to isolate tenant-leak variables from animation refactors.  │
└─────────────────────────────────────────────────────────────┘
```

---

## Item 1 — verification log (**GREEN**)

- **Build:** `npm run build` — passed (webpack).
- **Unit tests:** `tests/credit-hub/content/pages/list.test.tsx`, `tests/credit-hub/polish/a11y/aria-labels.test.tsx` — passed.
- **Legacy grep (page):** no `ForgeButton` / `ForgeCard` / `ForgeInput` / `CHEmptyState` / `ApplicationCard` / `framer-motion` on dealer applications list.
- **Lighthouse (dealer applications list):** `app/(forge)/credit-hub/_design/_inventory/lh-dealer-applications-list-a11y.json` — **`categories.accessibility.score`: `1.0`** (≥ 0.95). Clean rebuild + single `next start -p 3015`; prior `__next_error__` capture attributed to **stale `.next` / competing servers** — see `lh_error_shell_diagnosis.md` and **Gate hygiene** in `COMPONENTS.md`. CLI may still exit `1` on Windows (`EPERM` temp cleanup) while JSON is valid.

---

## Item 2 — design questions

*(If a primitive has two reasonable treatments, log here and wait for Cesar before choosing.)*

— None raised during Group 1 (forms).

— **Group 2 (actions):** Focus ring (`forgeBrand-500`, 2px + offset) checked on `/credit-hub/preview` **Focus on surfaces** swatches (card, `bg-forgeBrand-900`, modal scrim `rgba(15,23,41,0.48)`); ring remains legible on Tab — **no** alternate `brand-300` / double-ring treatment required for this gate.

---

## Item 2 — code-level findings (call-site a11y)

*(IconButton `aria-label` is enforced on the primitive; list here if grep finds unsafe patterns.)*

— **Group 2:** Grep of `IconButton` under `app/` + `components/`: **all** usages include `aria-label` — **0** call-site fixes required.

---

## Item 2 Group 1 — Forms (**GREEN**)

**Primitives:** `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `DateInput`, `MoneyInput`

**Changes:**

- **Input:** Wrapper `focus-within` uses **2px `outline` + offset** (replacing ring); **`--forge-duration-fast` (120ms) ease-out** transitions; **hover** border/background when not disabled/error; **disabled** label + shell (`border-forgeInk-100`, `bg-forgeInk-50`, `cursor-not-allowed`, muted text).
- **Textarea:** Stable **`useId`** when `id`/`name` missing; same hover / focus outline / disabled treatment as Input.
- **Select:** Same hover / outline / disabled styling; label reflects disabled.
- **Checkbox / RadioGroup:** Label **hover** (ink) when interactive; **disabled** cursor + `text-forgeInk-400`; inputs get disabled border/bg tokens.
- **Switch:** Disabled uses **structural** colors (not blanket opacity); track `bg-forgeInk-100` when disabled; **hover** border when enabled; label muted when disabled; thumb `translate` remains functional motion only.
- **MoneyInput / DateInput:** Hover + disabled + error border parity with other fields; labels muted when disabled.

| Primitive   | Hover | Focus | Disabled | Loading | Status |
|------------|-------|-------|----------|---------|--------|
| Input      | ✓     | ✓     | ✓        | n/a     | **green** — updated |
| Textarea   | ✓     | ✓     | ✓        | n/a     | **green** — updated + `useId` |
| Select     | ✓     | ✓     | ✓        | n/a     | **green** — updated |
| Checkbox   | ✓     | ✓     | ✓        | n/a     | **green** — updated |
| RadioGroup | ✓     | ✓     | ✓        | n/a     | **green** — updated |
| Switch     | ✓     | ✓     | ✓        | n/a     | **green** — updated |
| DateInput  | ✓     | ✓     | ✓        | n/a     | **green** — updated |
| MoneyInput | ✓     | ✓     | ✓        | n/a     | **green** — updated |

**Preview:** `/credit-hub/preview` — “Form controls” split into **Default** and **Disabled & error** columns (added error/disabled demos).

**Verification (this group):**

- `npm run build` — passed (webpack).
- **Lighthouse** (`app/(forge)/credit-hub/_design/_inventory/lh-forge-preview-a11y.json`): **`categories.accessibility.score`: `0.97`** (≥ 0.95). Gate hygiene: stop servers, `rm -rf .next`, one `npm run build`, one `next start -p 3017`, then audit. If the score collapses, check the JSON for `html#__next_error__` — that means a **stale server** was still running against a rebuilt `.next` (same class of failure as Item 1). CLI may still exit `1` on Windows (`EPERM` temp cleanup) while JSON is valid.
- **axe-core CLI:** `npx @axe-core/cli http://localhost:3017/credit-hub/preview --load-delay 2000 -q` — **exit `0`**.

### Item 2 — remaining groups (todo)

| Group | Scope | Status |
|-------|--------|--------|
| 2 | Actions (Button, IconButton) | **green** — see Group 2 below |
| 3 | Tables (DataTable, …) | **green** — see Group 3 below |
| 4 | Navigation (Sidebar, Topbar, Tabs, Breadcrumb, CommandPalette) | **green** — see Group 4 below |
| 5 | Overlays (Modal, Drawer, Toast, …) | todo |

---

## Item 2 Group 2 — Actions (**GREEN**)

**Primitives:** `Button`, `IconButton`

**Changes:**

- **Button:** Removed `disabled:opacity-50` / `pointer-events-none` in favor of **per-variant muted** tokens when `disabled && !loading`. **Leading spinner** when `loading`; label + optional trailing icon stay visible; **`aria-busy`** while loading; **`disabled` on element** whenever `disabled || loading`. **`loading` + `disabled` together:** loading UI (spinner + frozen variant colors) still applies — callers should prefer `loading` alone during submit. **120ms** transitions on color. **No transform** on hover (color-only).
- **IconButton:** **`disabled:`** cursor, ink, and surface tokens; **hover suppressed** when disabled (`disabled:hover:bg-*` matches resting disabled). Default / subtle variants unchanged for enabled hover.
- **`COMPONENTS.md`:** Button / IconButton subsection — **leading spinner** convention, disabled vs loading precedence, focus-ring note for dark chrome.
- **`/credit-hub/preview`:** Variants grid, **loading** row (all variants + leading-icon demo), **disabled** row, IconButton disabled pair, **Focus on surfaces** triptych (card / `forgeBrand-900` / scrim).

| Primitive   | Hover | Focus | Disabled | Loading | Status |
|------------|-------|-------|----------|---------|--------|
| Button     | ✓     | ✓     | ✓        | ✓       | **green** — leading spinner + `aria-busy` + muted disabled |
| IconButton | ✓     | ✓     | ✓        | n/a     | **green** — disabled hover locked; `aria-label` required in type |

**Verification (this group):**

- `npm run build` — passed (webpack).
- **Lighthouse** (`app/(forge)/credit-hub/_design/_inventory/lh-forge-preview-a11y.json`): **`categories.accessibility.score`: `0.97`** (≥ 0.95). Gate hygiene: stop servers on audit ports, `rm -rf .next`, one `npm run build`, one `next start -p 3017`, then audit (no `html#__next_error__` in JSON).
- **axe-core CLI:** `npx @axe-core/cli http://localhost:3017/credit-hub/preview --load-delay 2000 -q` — **exit `0`**.

---

## Item 2 Group 3 — Tables (**GREEN**)

**Primitives / surfaces:** `DataTable` (cells, headers, optional sort), `Skeleton` (decorative vs labelled)

**Notes:** Forge does not ship a separate **Pagination** / **column visibility** / **bulk bar** primitive — those live in app pages (e.g. bank queue). Preview documents **pagination button disabled spec** and a **bulk bar layout** strip for audit.

**Changes:**

- **DataTable:** **`loading`** + column-aligned **skeleton** body, wrapper **`aria-busy`**; **empty** state uses **`<EmptyState>`** with optional **`emptyDescription`** / **`emptyAction`**; **row hover** `surface-sunken/50` only (no transform); optional **`onSort` + `sort`** on a column → **`<th aria-sort>`** + header **button** with focus ring and sort affix.
- **Skeleton:** Optional **`label`** — omit for **decorative** blocks ( **`aria-hidden`** ); set **`label`** for standalone status skeletons.
- **`COMPONENTS.md`:** DataTable subsection (empty / loading / sort / row hover).
- **`/credit-hub/preview`:** Table **mode** select (rows / loading / empty), **density** select, **sortable Applicant** column, **bulk** strip, **pagination** buttons.

| Surface / primitive | Hover | Focus | Disabled | Loading | Status |
|---------------------|-------|-------|----------|---------|--------|
| DataTable (body)    | ✓ rows | ✓ sort btn | n/a      | ✓ skeleton + `aria-busy` | **green** |
| DataTable (empty)   | n/a   | n/a   | n/a      | n/a     | **green** — `<EmptyState>` |
| Skeleton (decorative) | n/a | n/a   | n/a      | n/a     | **green** — `aria-hidden` when no `label` |

**Verification (this group):**

- `npm run build` — passed (webpack).
- **Lighthouse** (`app/(forge)/credit-hub/_design/_inventory/lh-forge-preview-a11y.json`): **`categories.accessibility.score`: `0.97`** (≥ 0.95). Gate hygiene + no `html#__next_error__`.
- **axe-core CLI** on `/credit-hub/preview` — **exit `0`**.

---

## Item 2 Group 4 — Navigation (**GREEN**)

**Primitives / layout:** `Sidebar`, `Topbar`, `Tabs`, `Breadcrumb`, `CommandPalette`

**Changes:**

- **Tabs (`line`):** Active tab **underline `border-forgeBrand-500`** + `text-forgeBrand-700`; inactive **bottom border `border-forgeInk-200`** + hover ink shift (no transform). **Disabled** tabs: **ink-300** + `!border-transparent`, no opacity wash; hover locked to resting.
- **Tabs (`pills`):** Unchanged interaction baseline (Group 2 buttons own dense surfaces).
- **Sidebar:** Link transitions **`ease-out`** (120ms token path).
- **Breadcrumb:** Trunc link **`focus-visible`** ring (`forgeBrand-500`, 2px + offset) + rounded hit target; chevrons remain **`aria-hidden`**.
- **CommandPalette:** **`closeOnBackdropClick`** prop (default `true`); **`Command.Item`** row **`focus-visible`** ring + **120ms** color transition; backdrop respects prop.

| Primitive / layout | Hover | Focus | Disabled | Loading | Status |
|--------------------|-------|-------|----------|---------|--------|
| Tabs               | ✓     | ✓     | ✓        | n/a     | **green** — line spec + disabled tokens |
| Sidebar            | ✓     | ✓     | n/a      | n/a     | **green** — `aria-current` unchanged |
| Topbar             | n/a   | n/a   | n/a      | n/a     | **green** — actions slot uses Group 2 primitives |
| Breadcrumb         | ✓     | ✓     | n/a      | n/a     | **green** — link focus ring |
| CommandPalette     | ✓ rows | ✓     | n/a      | n/a     | **green** — backdrop opt-out + item focus |

**Verification (this group):**

- `npm run build` — passed (webpack).
- **Lighthouse** (`app/(forge)/credit-hub/_design/_inventory/lh-forge-preview-a11y.json`): **`categories.accessibility.score`: `0.97`** (≥ 0.95).
- **axe-core CLI** on `/credit-hub/preview` — **exit `0`**.

---
