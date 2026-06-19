# PR-LEGACY-2 — Repoint Legacy Credit Tests/Imports to Credit Hub

**Repo:** nadakki-dashboard
**Branch:** `fix/legacy-credit-tests-to-credit-hub` (from `main` @ `3b534d1`)
**Prerequisite:** PR #147 (PR-LEGACY-1 redirects) **MERGED** into main (merge commit `3b534d1`, verified). Redirects present in `next.config.js`.
**Scope:** Update tests/imports that still targeted legacy `/credit/*` routes or the legacy `components/layout/DashboardLayout`. **No legacy runtime routes deleted or modified.** No backend changes.

---

## STATUS: DONE

## FILES CHANGED
1. `tests/credit-hub/polish/layout-isolation.test.tsx` — **UPDATE_TO_CREDIT_HUB** (decouple from legacy `DashboardLayout`).
2. `tests/integration/frontend/test_dealer_flow_mobile.tsx` — **UPDATE_TO_CREDIT_HUB** (Lighthouse-budget URL string).
3. `e2e/dealer/calibration-helpers.ts` — **UPDATE_TO_CREDIT_HUB** (doc comment only).
4. `docs/audits/PR_LEGACY_2_TESTS_IMPORTS_MIGRATION_REPORT.md` — this report.

No `app/credit/*`, `app/(dealer)/*`, `components/layout/DashboardLayout.tsx`, PR-FE-6, EvidenceGrid, `_handoff/`, `design-system/`, or temp files were touched.

## LEGACY REFERENCES FOUND (10 files) + CLASSIFICATION
| File | Legacy ref | Classification | Action |
|---|---|---|---|
| `tests/credit-hub/polish/layout-isolation.test.tsx` | mocks `@/components/layout/DashboardLayout` (+ stale `RequireAuth`) | UPDATE_TO_CREDIT_HUB | Repointed mocks to real `GlobalForgeAppShell`/`ProtectedRoute` |
| `tests/integration/frontend/test_dealer_flow_mobile.tsx` | budget URL string `/credit/dealer/new` | UPDATE_TO_CREDIT_HUB | → `/credit-hub/dealer/applications/new` |
| `e2e/dealer/calibration-helpers.ts` | comment `/credit/dealer/[id]` | UPDATE_TO_CREDIT_HUB | → `/credit-hub/dealer/applications/[id]` |
| `tests/integration/dealer-analytics/test_dashboard.test.tsx` | imports `@/app/credit/dealer/analytics/page` | KEEP_TEMPORARILY | `/credit/dealer/analytics` has **no** modern route and is **not** redirected; test still valid |
| `e2e/dealer-analytics/test_dashboard_e2e.spec.ts` | `page.goto("/credit/dealer/analytics")` | KEEP_TEMPORARILY | same — route not redirected |
| `e2e/realtime/test_realtime_flow.spec.ts` | `page.goto("/credit/dealer/real")` | KEEP_TEMPORARILY | `/credit/dealer/real` has no modern equivalent and is **not** redirected |
| `e2e/dealer/test_compressed_wizard_e2e.spec.ts` | `goto /credit/dealer/new` + legacy `compressed-wizard-root` asserts | DELETE_IN_PR_LEGACY_3 | self-skips post-redirect; legacy-only UI |
| `e2e/dealer/test_health_score_e2e.spec.ts` | `goto /credit/dealer/:id` + legacy `app-health-score-root` asserts | DELETE_IN_PR_LEGACY_3 | self-skips post-redirect; legacy T6.4 UI |
| `e2e/dealer/test_risk_based_ux.spec.ts` | `goto /credit/dealer/:id` + legacy `risk-based-ui-root` asserts | DELETE_IN_PR_LEGACY_3 | self-skips post-redirect; legacy UI |
| `e2e/dealer/test_mobile_responsive.spec.ts` | `goto /credit/dealer/:id` + legacy "Command view" asserts | DELETE_IN_PR_LEGACY_3 | asserts legacy command-view UI on a now-redirected route |

## REFERENCES UPDATED TO `/credit-hub/*`
- **`layout-isolation.test.tsx`** (most important): `AppGate` no longer renders `components/layout/DashboardLayout` — it renders `@/components/forge/layout/GlobalForgeAppShell` wrapped by `@/components/forge/auth/ProtectedRoute`. The test previously mocked the **stale** modules (`DashboardLayout`, `RequireAuth`), so the unmocked real shell pulled in `next/font/google` (`Inter`) and the suite **failed to run on main**. Repointed the mocks to the real collaborators (`GlobalForgeAppShell` → `forge-shell`, `ProtectedRoute` passthrough), removing the legacy `DashboardLayout` dependency and fixing the suite. Assertions updated to current `AppGate` behavior (single global Forge shell for app routes; no shell on `/login`). The legacy `DashboardLayout.tsx` file is **not** modified or deleted.
- **`test_dealer_flow_mobile.tsx`**: Lighthouse performance-budget `targetUrl` repointed `/credit/dealer/new` → `/credit-hub/dealer/applications/new`. The test otherwise renders legacy components (`CompressedWizard`, `AppHealthScore`) directly and is unaffected.
- **`calibration-helpers.ts`**: docstring path updated to the modern route for accuracy (no behavioral code).

## REFERENCES KEPT TEMPORARILY (not changed, justified)
- `tests/integration/dealer-analytics/test_dashboard.test.tsx`, `e2e/dealer-analytics/test_dashboard_e2e.spec.ts` → `/credit/dealer/analytics`: **no modern route**; PR-LEGACY-1 regex guard deliberately excludes `analytics`, so the route is still served. Test subject still valid.
- `e2e/realtime/test_realtime_flow.spec.ts` → `/credit/dealer/real`: **no modern route**; excluded from redirects (`real` guard). Still served.

## REDIRECT TESTS ADDED/UPDATED
None added. The repo has **no** dedicated `redirects()` unit test, and `next.config.js` redirect syntax is validated at build time (PR-LEGACY-1 already build-verified). The 6 PR-LEGACY-1 redirects (`/credit/dealer/new`, `/credit/dealer/:id`, `/credit/dealer`, `/credit/bank/:id`, `/credit/bank`, `/credit/status/:id`) and the non-redirected KEEP routes (`/credit/dealer/analytics`, `/credit/dealer/real`, `/credit`, `/credit/new`, `/credit/dashboard`, `/credit/[id]/offers`, `/credit/[id]/confirmation`) remain covered by the merged config; this PR does not alter them. (A focused redirect-behavior test could be added in a follow-up but is out of scope here.)

## TESTS RUN
- `npm run typecheck` → **PASS** (`tsc --noEmit`, exit 0).
- `npm run lint` → **PASS** (eslint scoped, `--max-warnings 0`, exit 0).
- `npm run build` → **PASS** (`next build`, exit 0).
- Targeted jest:
  - `tests/credit-hub/polish/layout-isolation.test.tsx` → **PASS** (3/3) — previously failed-to-run on main.
  - `test_dealer_flow_mobile` → **PASS** (6/6).
- Note: pre-existing untracked `_handoff/` (unrelated, unresolved imports) was temporarily moved out during typecheck/build and restored afterward.

## REMAINING BLOCKERS BEFORE DELETE (PR-LEGACY-3)
1. **DELETE_IN_PR_LEGACY_3 e2e specs** (`test_compressed_wizard_e2e`, `test_health_score_e2e`, `test_risk_based_ux`, `test_mobile_responsive`) assert legacy-only dealer UI on now-redirected routes. They self-skip (except `test_mobile_responsive`, which lacks a skip guard and would fail against the modern detail page). These must be **removed or rewritten against modern `/credit-hub/*` UI** when the legacy routes/components are deleted. Not repointed here because the modern wizard/detail UI differs (different selectors) — a URL-only swap would not validate the same behavior.
2. **KEEP_TEMPORARILY routes** (`/credit/dealer/analytics`, `/credit/dealer/real`) still have no modern equivalent; their tests (and the legacy pages) must stay until parity lands. Do **not** delete these routes in PR-LEGACY-3.
3. Once (1) and (2) are resolved, `app/credit/dealer/*`, `app/credit/bank/*`, `app/credit/status/[applicationId]`, orphan `app/(dealer)/layout.tsx`, and orphan `components/layout/DashboardLayout.tsx` are safe to delete.

## RISK
**LOW.** Test-only changes. The one behavioral test rewrite (`layout-isolation`) replaced stale/broken mocks with the real shell collaborators, turning a failing-to-run suite into a passing one that reflects current `AppGate` behavior. No productive/runtime code, no backend, no route deletions.

## RECOMMENDATION
**APPROVE / MERGE.** Then proceed to **PR-LEGACY-3**: delete redirected legacy routes + orphan `app/(dealer)/layout.tsx` + orphan `DashboardLayout.tsx`, remove/rewrite the 4 DELETE_IN_PR_LEGACY_3 e2e specs, and keep `/credit/dealer/analytics` + `/credit/dealer/real` (and their tests) until modern parity exists.
