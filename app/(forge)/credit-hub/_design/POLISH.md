# Phase 5 — polish tracker (Forge Credit Hub)

Status: `todo` | `done` | `deferred-phase-7`

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| **1** | Dealer `/credit-hub/dealer/applications` list — Forge primitives, URL `q` / `status` / `density`, DataTable + density, PullToRefresh kept | **done** | `page.tsx`, `DataTable.tsx` (`density`), tests: stable `useSearchParams` mock |
| **2** | Hover / focus / disabled / loading sweep — `components/forge/ui/*` | todo | Checklist in this file after sweep |
| **3** | Toast wiring (bank detail, wizard autosave, consent, uploads) | todo | Sonner primitive |
| **4** | Empty states sweep (bank + dealer zero-data surfaces) | todo | Icons + CTAs per Appendix A |
| **5** | CommandPalette wiring (Cmd+K, routes, density, sign out) | todo | cmdk |
| **Tenant coupling** | Hardcoded tenant copy/colors/currency (Phase 6 prep) | todo | Log leaks here when found |

---

## Item 1 — verification log

- **Build:** `npm run build` — passed (webpack).
- **Unit tests:** `tests/credit-hub/content/pages/list.test.tsx`, `tests/credit-hub/polish/a11y/aria-labels.test.tsx` — passed.
- **Legacy grep (page):** no `ForgeButton` / `ForgeCard` / `ForgeInput` / `CHEmptyState` / `ApplicationCard` / `framer-motion` on dealer applications list.
- **Lighthouse (dealer applications list):** CLI may exit `1` on Windows (`EPERM` cleanup) while still writing JSON; use `TEMP`/`TMP` + `--user-data-dir` per `COMPONENTS.md`. If the saved run shows `html#__next_error__`, the server returned the Next error shell — **discard that JSON**, fix the underlying 500, and re-run. *Artifact not committed for this session after error-page capture.*

## Item 2 — forge/ui checklist (placeholder)

| Primitive | Hover | Focus | Disabled | Loading | Status |
|-----------|-------|-------|----------|---------|--------|
| Button | | | | | todo |
| Input | | | | | todo |
| … | | | | | todo |

*(Fill during Item 2 sweep.)*

## PullToRefresh (dealer applications)

**Kept** — `PullToRefresh` still wraps the list; it uses `framer-motion` internally for pull gesture. **Phase 7:** optional replacement with CSS scroll-driven or reduced-motion-only refresh if product wants zero `motion` in Credit Hub shell.
