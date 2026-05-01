# Phase 5 — polish tracker (Forge Credit Hub)

Status: `todo` | `done` | `deferred-phase-7` | **green**

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| **1** | Dealer `/credit-hub/dealer/applications` list — Forge primitives, URL `q` / `status` / `density`, DataTable + density, PullToRefresh kept | **green** | Lighthouse a11y **1.0** — `lh-dealer-applications-list-a11y.json`; diagnosis `lh_error_shell_diagnosis.md` |
| **2** | Hover / focus / disabled / loading sweep — `components/forge/ui/*` + layout | in progress | Group 1 (forms) **green** — see below |
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
| 2 | Actions (Button, IconButton) | todo |
| 3 | Tables (DataTable, …) | todo |
| 4 | Navigation (Sidebar, Topbar, Tabs, Breadcrumb, CommandPalette) | todo |
| 5 | Overlays (Modal, Drawer, Toast, …) | todo |
