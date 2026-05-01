# SSR investigation — `/credit-hub/bank/applications/[applicationId]` (Phase 4)

Date: 2026-05-01. Goal: explain the earlier **HTTP 500 / `ERRORED_DOCUMENT_REQUEST`** seen when the route used a **full-route** `next/dynamic(..., { ssr: false })` workaround, and determine the **narrowest** correct `ssr: false` scope (if any).

## 1. What was tested (workaround removed)

- **`next/dynamic` with `ssr: false` was removed** from `app/(forge)/credit-hub/bank/applications/[applicationId]/page.tsx` so `BankApplicationDetailView` is imported **directly** again.
- **Build:** `npm run build 2>&1 | Tee-Object …/ssr_failure_log.txt` — **completed successfully** (no compile-time SSR failure for this route).
- **Runtime:** fresh `npx next start -p 3012`, then `Invoke-WebRequest http://localhost:3012/credit-hub/bank/applications/test-id` — **HTTP 200**, HTML shell returned. **No stack trace** appeared in `ssr_server_console.txt` (stdout/stderr from `next start` for these requests).

## 2. Suspected heavy imports (reviewed in source)

| Module | Relevant import | Top-level `window` / `document`? |
|--------|-----------------|-----------------------------------|
| `components/credit-hub/dealer/analysis/ScoreVisual.tsx` | `framer-motion` → `motion.circle` | **No** — only used inside the component render. |
| `components/credit-hub/dealer/analysis/CreditAnalysisPanel.tsx` | `framer-motion` → `motion.div` | **No** — only used in JSX. |

There is **no** obvious **CAT B** (own code reading `window`/`localStorage` at module scope) in these files on inspection.

## 3. Classification

**Primary conclusion (this machine, this build):** the failure **does not reproduce** after a clean `next build` + fresh `next start`. The earlier 500 is best treated as:

**CAT E — Environment / artifact mismatch (non-reproducible on clean tree)**  
Examples: stale `.next` output while `app/layout.tsx` or route code changed, an old `next start` process still bound to the port serving an older server bundle, or an intermediate build state. **No single library line** was identified that **always** throws during SSR in the current dependency set.

Secondary note: if the 500 reappears in CI only, re-check **CAT D** (React 19 + Next 16 + `framer-motion` edge) with a pinned stack trace from that environment.

## 4. Final `ssr: false` scope

**Removed entirely** from the application detail route. Direct import of `BankApplicationDetailView` is used. **No** component-level `dynamic(..., { ssr: false })` is required for `ScoreVisual` / `CreditAnalysisPanel` in the reproduced clean build.

If a future regression produces a **pinned** stack trace implicating `framer-motion` init, the **first** narrowing step should be: `dynamic(() => import('./ScoreVisual'), { ssr: false })` **only** inside the overview branch — not the whole review surface.

## 5. Lighthouse (post-change)

- **Accessibility-only JSON:** `lh-bank-application-detail-a11y-v2.json` — **score `1`** on `http://localhost:3012/credit-hub/bank/applications/test-id` (no `runtimeError`).
- **Full run JSON (screenshot):** `lh-bank-application-detail-full-v2.json`
- **Screenshot (from `final-screenshot`, JPEG → PNG):** `lh-bank-application-detail-a11y-v2.png`

**Compared to chunk-2 “workaround” state:** the prior concern was Lighthouse hitting a **500 document** (invalid audit). With **direct SSR**, the document request succeeds; the saved PNG is the post–network-idle **final-screenshot** from Lighthouse (full Forge shell route, not an error page). Any brief **loading skeleton** before React hydrates is orthogonal to the **document** status (now 200).

## 6. Artifacts

| File | Purpose |
|------|---------|
| `ssr_failure_log.txt` | Full `npm run build` log with workaround removed |
| `ssr_server_console.txt` | `next start` stdout/stderr (no error lines on probe) |
| `lh-bank-application-detail-a11y-v2.json` | A11y-only Lighthouse after fix |
| `lh-bank-application-detail-full-v2.json` | Full Lighthouse incl. `final-screenshot` |
| `lh-bank-application-detail-a11y-v2.png` | Decoded screenshot |
