# Phase 5 — polish tracker (Forge Credit Hub)

Status: `todo` | `done` | `deferred-phase-7` | **green**

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| **1** | Dealer `/credit-hub/dealer/applications` list — Forge primitives, URL `q` / `status` / `density`, DataTable + density, PullToRefresh kept | **green** | Lighthouse a11y **1.0** — `lh-dealer-applications-list-a11y.json`; diagnosis `lh_error_shell_diagnosis.md` |
| **2** | Hover / focus / disabled / loading sweep — `components/forge/ui/*` | todo | Checklist in this file after sweep |
| **3** | Toast wiring (bank detail, wizard autosave, consent, uploads) | todo | Sonner primitive |
| **4** | Empty states sweep (bank + dealer zero-data surfaces) | todo | Icons + CTAs per Appendix A |
| **5** | CommandPalette wiring (Cmd+K, routes, density, sign out) | todo | cmdk |
| **Tenant coupling** | Hardcoded tenant copy/colors/currency (Phase 6 prep) | todo | Log leaks here when found |

---

## Item 1 — verification log (**GREEN**)

- **Build:** `npm run build` — passed (webpack).
- **Unit tests:** `tests/credit-hub/content/pages/list.test.tsx`, `tests/credit-hub/polish/a11y/aria-labels.test.tsx` — passed.
- **Legacy grep (page):** no `ForgeButton` / `ForgeCard` / `ForgeInput` / `CHEmptyState` / `ApplicationCard` / `framer-motion` on dealer applications list.
- **Lighthouse (dealer applications list):** `app/(forge)/credit-hub/_design/_inventory/lh-dealer-applications-list-a11y.json` — **`categories.accessibility.score`: `1.0`** (≥ 0.95). Clean rebuild + single `next start -p 3015`; prior `__next_error__` capture attributed to **stale `.next` / competing servers** — see `lh_error_shell_diagnosis.md` and **Gate hygiene** in `COMPONENTS.md`. CLI may still exit `1` on Windows (`EPERM` temp cleanup) while JSON is valid.

## Phase 7 decisions pending

- **PullToRefresh** (dealer applications list — still wraps the page): **Option A** — replace `framer-motion` with CSS-only pull affordance (`translateY` + `transition`), removing `framer-motion` from that module. **Option B** — keep `framer-motion` scoped to `PullToRefresh` only and document it as the sole allowed motion dependency for that gesture. **Phase 5:** no code change (Cesar accept).

## Item 2 — forge/ui checklist (placeholder)

| Primitive | Hover | Focus | Disabled | Loading | Status |
|-----------|-------|-------|----------|---------|--------|
| Button | | | | | todo |
| Input | | | | | todo |
| … | | | | | todo |

*(Fill during Item 2 sweep.)*
