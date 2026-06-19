# PR-LEGACY-1 — Redirect Legacy Credit Routes (redirects-only)

**Repo:** nadakki-dashboard
**Branch:** `fix/legacy-credit-route-redirects` (from `main` @ `506e103`)
**Source audit:** `docs/audits/LEGACY_CREDIT_ROUTES_REACHABILITY_AUDIT.md` (VERDICT: NEEDS_REDIRECT_FIRST)
**Scope:** Add temporary (`permanent: false`) redirects from legacy `/credit/*` routes to modern `/credit-hub/*` equivalents **only where parity is confirmed**. No legacy files deleted or modified. No backend changes.

---

## STATUS: DONE

## FILES CHANGED
- `next.config.js` — appended 6 redirect entries to the existing `async redirects()` array (same `permanent: false` pattern already used for `/legal-agents` and `/credit-hub/*` redirects).
- `docs/audits/PR_LEGACY_1_REDIRECTS_ONLY_REPORT.md` — this report.

No legacy route files, components, or tests were modified or deleted.

## REDIRECTS ADDED
All `permanent: false` (308 → actually 307 temporary; reversible while legacy pages still exist).

| # | Legacy source | Modern destination | Notes |
|---|---|---|---|
| 1 | `/credit/dealer/new` | `/credit-hub/dealer/applications/new` | Explicit literal, placed before the dynamic `:id` rule so it wins. |
| 2 | `/credit/dealer/:applicationId((?!analytics\|real\|new)[^/]+)` | `/credit-hub/dealer/applications/:applicationId` | Negative-lookahead **excludes** KEEP_TEMPORARILY segments `analytics` / `real` (and `new`, already handled by #1). |
| 3 | `/credit/dealer` | `/credit-hub/dealer` | Dealer dashboard. |
| 4 | `/credit/bank/:applicationId` | `/credit-hub/bank/applications/:applicationId` | Bank application detail. |
| 5 | `/credit/bank` | `/credit-hub/bank` | Bank queue/dashboard. |
| 6 | `/credit/status/:applicationId` | `/credit-hub/dealer/applications/:applicationId` | Dealer-facing status → modern application detail (approx parity per audit). |

Ordering rationale: more specific sources precede dynamic `:id` sources; first match wins in Next.js `redirects()`. The dynamic dealer rule is regex-guarded so it cannot swallow the KEEP_TEMPORARILY routes.

## MODERN TARGETS CONFIRMED (exist on disk under `app/(forge)/credit-hub/`)
- `dealer/page.tsx` → `/credit-hub/dealer` ✅
- `dealer/applications/new/page.tsx` → `/credit-hub/dealer/applications/new` ✅
- `dealer/applications/[applicationId]/page.tsx` → `/credit-hub/dealer/applications/:applicationId` ✅
- `bank/page.tsx` → `/credit-hub/bank` ✅
- `bank/applications/page.tsx` → `/credit-hub/bank/applications` ✅
- `bank/applications/[applicationId]/page.tsx` → `/credit-hub/bank/applications/:applicationId` ✅

Note: there is **no** `/credit-hub/dealer/new`, `/credit-hub/dealer/[id]`, or `/credit-hub/bank/[id]` — modern detail/new paths nest under `applications`, which is why the destinations map to `…/applications/…`.

## ROUTES INTENTIONALLY KEPT (KEEP_TEMPORARILY — NOT redirected)
No confirmed 1:1 modern target, so no redirect was added (per rules):
- `/credit/dealer/analytics` — no modern dealer-analytics route.
- `/credit/dealer/real` — realtime demo; no modern equivalent.
- `/credit` (Credit Core overview), `/credit/new`, `/credit/dashboard`, `/credit/[id]`, `/credit/[id]/offers`, `/credit/[id]/confirmation` — partial/no parity in `/credit-hub/*`.

These remain fully reachable and functional. The regex guard on rule #2 ensures `analytics`/`real` are not accidentally redirected.

## TESTS
- `npm run typecheck` → **PASS** (`tsc --noEmit`, exit 0).
- `npm run lint` → **PASS** (eslint scoped set, `--max-warnings 0`, exit 0).
- `npm run build` → **PASS** (`next build`, exit 0). Build compiles `redirects()` via path-to-regexp, so the regex-guarded source pattern is validated as syntactically correct.
- No dedicated redirect/routing unit tests exist in the repo; none added (redirects-only, validated by build).
- Note: the pre-existing untracked `_handoff/` directory was temporarily moved out of the repo during typecheck/build (it contains unresolved imports unrelated to this PR) and restored afterward. It is not part of this PR.

## RISK
**LOW.**
- Additive change to `next.config.js` only; no legacy code deleted or behavior-changed.
- `permanent: false` keeps redirects reversible and avoids browser-cached 308s.
- Internal legacy cross-links now resolve to modern equivalents instead of 404 after eventual deletion.
- KEEP_TEMPORARILY routes explicitly excluded → no functional regression for analytics/realtime/credit-core overview.
- Residual: deep-links to `/credit/dealer/new` and `/credit/status/:id` now land on modern flows; acceptable since modern parity is confirmed.

## RECOMMENDATION
**APPROVE / MERGE.** Proceed afterward with **PR-LEGACY-2** (repoint the 10 legacy-targeting tests + `layout-isolation.test.tsx` to `/credit-hub/*`), then **PR-LEGACY-3** (delete redirected legacy routes + orphan `app/(dealer)/layout.tsx` + orphan `components/layout/DashboardLayout.tsx`). Do not delete legacy routes in this PR.

## NEXT ACTION
Merge PR-LEGACY-1, then start PR-LEGACY-2 (test/import migration).
