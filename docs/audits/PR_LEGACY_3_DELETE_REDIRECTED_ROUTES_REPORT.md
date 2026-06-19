# PR-LEGACY-3 — Delete Redirected Legacy Credit Routes

**Repo:** nadakki-dashboard
**Branch:** `fix/delete-redirected-legacy-credit-routes` (from `main` @ `c6880c6`)
**Prerequisite:** PR #148 (PR-LEGACY-2) **MERGED** into main (merge commit `c6880c6`, verified — `forge-shell` + modern URLs present in main).
**Scope:** Surgically delete legacy `/credit/*` routes already covered by PR-LEGACY-1 redirects, plus confirmed orphans and obsolete legacy-only e2e specs. **No backend, no `next.config.js` change, no deletion of non-parity routes.**

---

## STATUS: DONE

## ROUTES DELETED (redirected → modern parity, covered by PR-LEGACY-1)
| Legacy route | Redirects to (PR-LEGACY-1) |
|---|---|
| `/credit/dealer` | `/credit-hub/dealer` |
| `/credit/dealer/new` | `/credit-hub/dealer/applications/new` |
| `/credit/dealer/:id` | `/credit-hub/dealer/applications/:id` |
| `/credit/bank` | `/credit-hub/bank` |
| `/credit/bank/:id` | `/credit-hub/bank/applications/:id` |
| `/credit/status/:id` | `/credit-hub/dealer/applications/:id` |

All six remain reachable as 307 redirects (next.config.js untouched), so deep-links/bookmarks still resolve to modern UI.

## FILES DELETED (20)
**Legacy route pages + clients (13):**
- `app/credit/dealer/page.tsx`
- `app/credit/dealer/DealerListClient.tsx`
- `app/credit/dealer/new/page.tsx`
- `app/credit/dealer/new/DealerNewWizard.tsx`
- `app/credit/dealer/new/DealerNewEntry.tsx`
- `app/credit/dealer/[applicationId]/page.tsx`
- `app/credit/dealer/[applicationId]/DealerApplicationClient.tsx`
- `app/credit/bank/page.tsx`
- `app/credit/bank/BankQueueClient.tsx`
- `app/credit/bank/[applicationId]/page.tsx`
- `app/credit/bank/[applicationId]/BankApplicationClient.tsx`
- `app/credit/status/[applicationId]/page.tsx`
- `app/credit/status/[applicationId]/ClientStatusClient.tsx`

**Orphans (2):**
- `app/(dealer)/layout.tsx` — orphan route group (no pages; H3).
- `components/layout/DashboardLayout.tsx` — orphan shell (zero imports; H4).

**Obsolete legacy-only e2e specs + orphaned helper (5):**
- `e2e/dealer/test_compressed_wizard_e2e.spec.ts`
- `e2e/dealer/test_health_score_e2e.spec.ts`
- `e2e/dealer/test_risk_based_ux.spec.ts`
- `e2e/dealer/test_mobile_responsive.spec.ts`
- `e2e/dealer/calibration-helpers.ts` — orphan after the two specs that imported it were deleted.

## FILES MODIFIED
None. (Only deletions + the new report.)

## ROUTES KEPT TEMPORARILY (no modern parity — NOT deleted, NOT redirected)
- `app/credit/dealer/analytics/` (page + layout) — no `/credit-hub/dealer/analytics` route exists. **KEEP** (H2).
- `app/credit/dealer/real/` — realtime lab; no modern equivalent. **KEEP** (H2).
- `app/credit/page.tsx` (`/credit` overview), `app/credit/new`, `app/credit/dashboard`, `app/credit/[id]`, `app/credit/[id]/offers`, `app/credit/[id]/confirmation` — partial/no parity. **KEEP**.
- `app/credit/dealer/layout.tsx` — shared `RouteErrorBoundary` still wrapping the KEEP analytics/real subroutes. **KEEP** (must not delete).

## ORPHANS REMOVED
- `components/layout/DashboardLayout.tsx` (27,750 bytes) — confirmed orphan: `AppGate` renders `GlobalForgeAppShell` + `ProtectedRoute` (re-verified on post-#148 main), and no file imports `DashboardLayout` (only a stale comment in deprecated `Sidebar.tsx` + docs/`fix-sidebar.js`).
- `app/(dealer)/layout.tsx` — orphan route group wrapper (no pages in the group).

## TESTS REMOVED / SKIPPED / REWRITTEN
- **Removed (4 specs + 1 helper):** the compressed-wizard / health-score / risk-based-UX / mobile-responsive e2e specs asserted legacy-only dealer UI (`compressed-wizard-root`, `app-health-score-root`, `risk-based-ui-root`, legacy "Command view") on routes now redirected to a **different** modern wizard/detail. No faithful `/credit-hub/*` repoint exists (different selectors), so they were deleted rather than falsely repointed (per "No hacer repoint falso"). `calibration-helpers.ts` removed as orphan.
- **Kept (no change):** `e2e/dealer/helpers.ts` — still imported by the KEEP analytics e2e spec (`e2e/dealer-analytics/test_dashboard_e2e.spec.ts`), so it was preserved. `e2e/dealer-analytics/*` and `e2e/realtime/*` target KEEP routes (`/credit/dealer/analytics`, `/credit/dealer/real`) and are untouched.
- **Not rewritten:** `tests/credit-hub/polish/layout-isolation.test.tsx` and `tests/integration/frontend/test_dealer_flow_mobile.tsx` were already modernized in PR-LEGACY-2; left as-is (they pass).

## REDIRECTS PRESERVED (H6)
`next.config.js` is **not** in the diff (verified: `git diff --name-only origin/main...HEAD -- next.config.js` is empty). All six PR-LEGACY-1 redirects remain. The `/credit/dealer/:id` guard `(?!analytics|real|new)` continues to protect the KEEP analytics/real routes (which still serve real pages).

## HYPOTHESIS RESULTS
| # | Hypothesis | Result | Evidence |
|---|---|---|---|
| H1 | Redirected routes have no active tests/imports depending on legacy impl | **TRUE** | Only the 4 deferred e2e specs touched them (deleted); each deleted client imported solely by its own deleted `page.tsx`; no productive import of deleted modules remains |
| H2 | `/credit/dealer/analytics` & `/credit/dealer/real` have no modern parity → keep | **TRUE** | No `/credit-hub/dealer/{analytics,real}` routes exist; both kept |
| H3 | `app/(dealer)/layout.tsx` orphan | **TRUE** | Only file in the `(dealer)` group; no pages |
| H4 | `components/layout/DashboardLayout.tsx` orphan | **TRUE** | `AppGate` uses `GlobalForgeAppShell`; zero imports of `DashboardLayout` |
| H5 | 4 deferred specs validate legacy-only UI → delete/deprecate | **TRUE** | Legacy selectors on redirected routes; deleted (no faithful modern repoint) |
| H6 | Keep `next.config.js` redirects intact | **TRUE** | `next.config.js` unchanged; 6 redirects preserved |
| H7 | No PR-FE-6 / PR-FE-1 / EvidenceGrid / `_handoff` / `design-system` / temp files touched | **TRUE** | Diff = deletions of legacy routes/orphans/specs + this report only |

All hypotheses passed → proceeded with deletion.

## AUTOCORRECTIONS APPLIED
1. **Discovered `app/credit/dealer/layout.tsx`** (shared error-boundary wrapping KEEP analytics/real) → excluded from deletion to avoid breaking the KEEP subroutes.
2. **Preserved `e2e/dealer/helpers.ts`** after finding the KEEP analytics e2e spec imports it (`../dealer/helpers`); only deleted `calibration-helpers.ts` (truly orphaned).
3. **Stale `.next/types` typecheck errors** (TS2307 referencing deleted pages in `.next/types/validator.ts`) were resolved by running `next build` first to regenerate route types, then `tsc --noEmit` (clean). These were stale build artifacts, not source errors.
4. **Left in place (documented residuals, out of scope):** `components/credit/commercial/DemoModeLauncher.tsx` (now unused after `DealerListClient` deletion, but it's a component re-exported via `components/credit/index.ts`, not a route — links to a redirected path); the stale `@deprecated` comment in unused `components/layout/Sidebar.tsx` referencing the deleted `DashboardLayout`; and the root dev script `fix-sidebar.js` (not part of typecheck/lint/build). None affect the build.

## TESTS RUN
- `npm run build` → **PASS** (`next build`, exit 0; regenerated route types).
- `npm run typecheck` → **PASS** (`tsc --noEmit`, exit 0 after rebuild).
- `npm run lint` → **PASS** (eslint scoped, `--max-warnings 0`, exit 0).
- Targeted jest:
  - `tests/credit-hub/polish/layout-isolation.test.tsx` → **PASS** (3/3).
  - `test_dealer_flow_mobile` → **PASS** (6/6).
  - `tests/integration/dealer-analytics/test_dashboard.test.tsx` (KEEP analytics page regression) → **PASS** (11/11).
- Note: pre-existing untracked `_handoff/` was temporarily moved out during build/typecheck and restored afterward — not part of this PR.

## RISK
**LOW–MEDIUM.** Deletions only, all behind preserved redirects, with import-graph verified (no dangling imports). Residual: the four deleted e2e specs leave a coverage gap for the *legacy* dealer flows (those flows are deprecated; modern `/credit-hub/*` e2e coverage is a separate follow-up). KEEP routes verified still building/testing green.

## RECOMMENDATION
**APPROVE / MERGE.** Follow-ups (separate PRs, optional): remove now-orphan `DemoModeLauncher` + clean the stale `Sidebar.tsx`/`fix-sidebar.js` references; add modern `/credit-hub/*` dealer e2e coverage; and retire `/credit/dealer/analytics` + `/credit/dealer/real` (and `/credit` overview family) once modern parity ships.
