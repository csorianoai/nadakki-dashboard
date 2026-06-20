# PR-INFRA-1 — Stabilize react-pdf Jest and `_handoff` exclusion

**Branch:** `fix/test-infra-react-pdf-handoff`
**Base:** `origin/main` @ `c4b39af` (PR #150 EvidenceGrid — **MERGED** ✅)
**Scope:** infrastructure / config / test only. No functional Credit Hub changes.

---

## STATUS: DONE
## RISK: LOW
## RECOMMENDATION: APPROVE

Removes two recurring sources of validation friction that affected every PR:
1. `_handoff/` breaking `typecheck`/`build`.
2. `react-pdf` ESM breaking Jest for any suite that (transitively) imports the PDF preview.

---

## Root cause — `_handoff/`
- `_handoff/` is **non-productive handoff material** (antispoofing reference drop): backend Python + a couple of frontend stubs (`LivenessCapture.tsx`, `liveness-client.ts`) with imports that don't resolve against this repo.
- `tsconfig.json` `include` globs `**/*.ts` / `**/*.tsx`, and `exclude` did **not** list `_handoff`, so `tsc --noEmit` (and `next build`'s type check) compiled those stubs and failed. This forced contributors to repeatedly move `_handoff/` out of the repo before validating (a manual, error-prone workaround seen across PR-FE-1/6 and PR-LEGACY-1/2/3).
- **Fix:** add `"_handoff"` to `tsconfig.json` `exclude`. The folder is **not deleted, not moved, and its contents are not modified.**

## Root cause — `react-pdf`
- `components/bank/DocumentPreviewPane.tsx` imports `react-pdf` (`import { Document, Page, pdfjs } from "react-pdf"`), which ships as **ESM** and depends on `pdfjs-dist` (also ESM).
- Jest uses `ts-jest` with the default `transformIgnorePatterns` (`/node_modules/` not transformed). Any suite that renders the bank application detail page (e.g. `tests/bank-application-detail/page.test.tsx`) failed to even load with:
  `SyntaxError: Cannot use import statement outside a module` (`node_modules/react-pdf/dist/index.js:1`).
- `tests/bank/DocumentPreviewPane.test.tsx` worked only because it declared a **local** `jest.mock("react-pdf", ...)`; other suites had no such guard.
- **Fix (allowed option B — explicit, documented mock):** add a global manual mock at `<rootDir>/__mocks__/react-pdf.tsx`. Jest applies it **automatically** to every suite (no per-test `jest.mock` needed), so future PRs that touch the bank detail page stay green. It is render-only (no real PDF rendering) and provides the surface the component uses (`Document`, `Page`, `pdfjs.version`, `pdfjs.GlobalWorkerOptions`, plus `Outline`/`Thumbnail`). Suites needing richer behavior may still override it locally — verified that `DocumentPreviewPane.test.tsx`'s local mock still takes precedence.
- The productive page/component was **not** changed to satisfy Jest.

## Files changed
| File | Change | Type |
|---|---|---|
| `tsconfig.json` | add `"_handoff"` to `exclude` | config |
| `__mocks__/react-pdf.tsx` | new global Jest manual mock for `react-pdf` | test infra |
| `docs/audits/PR_INFRA_1_REACT_PDF_HANDOFF_REPORT.md` | this report | docs |

No functional/Credit-Hub/backend/legacy/EvidenceGrid/AnalysisTab/`next.config.js`/`_handoff` content/`design-system` files touched.

## Why the fix is infra-only
- `tsconfig` exclude only scopes type checking; no runtime behavior changes.
- The Jest mock lives under `__mocks__/` and only affects the test runtime; it does not ship in the app bundle.
- No application code, routes, or features were modified.

## Tests
- `npm run typecheck` → **PASS** (exit 0), **with `_handoff/` left in place** (no manual move needed). ✅
- `npm run lint` → **PASS** (exit 0). ✅
- `npm run build` → **PASS** (exit 0), `_handoff/` in place. ✅
- `tests/bank-application-detail/page.test.tsx` → **PASS (3/3)** (was: suite failed to run). ✅
- `tests/bank/DocumentPreviewPane.test.tsx` → **PASS (14/14)** — confirms the local override mock still wins over the new global mock. ✅

## Hypotheses
| # | Hypothesis | Result |
|---|---|---|
| H1 | `_handoff/` is non-productive and should be excluded from typecheck/build | **TRUE** — excluded in tsconfig |
| H2 | react-pdf fails in Jest due to ESM transform, not a functional test error | **TRUE** — `Cannot use import statement outside a module` |
| H3 | Correct fix is Jest config / controlled mock, not changing productive logic | **TRUE** — global manual mock, no productive change |
| H4 | PR does not touch functional Credit Hub | **TRUE** |
| H5 | PR reduces noise for all future PRs | **TRUE** — global mock + tsconfig exclude remove the recurring manual workarounds |

## Risk — LOW
Config + test-only. No bundle/runtime impact. Local mocks still override the global mock, so no existing suite behavior regresses.

## Recommendation — APPROVE
Merge to stop the recurring `_handoff`/react-pdf validation friction across all future PRs.

---

## NEXT ACTION
Merge PR-INFRA-1; subsequent PRs no longer need to move `_handoff/` or hand-mock `react-pdf`.
