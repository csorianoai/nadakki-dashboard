# PR — EvidenceGrid: Connect Real Dossier Data (extracted from fc45b70)

**Repo:** nadakki-dashboard
**Branch:** `fix/evidence-grid-real-dossier-data` (from `main` @ `e79e1e6`)
**Source commit:** `fc45b70` — "feat(credit-hub): replace EvidenceGrid hardcodes with real dossier data" (originally on `feat/antispoofing-bank-evidence-real`).
**Prerequisite:** PR #149 (PR-LEGACY-3) **MERGED** into main (merge commit `e79e1e6`, verified).
**Scope:** Extract only the EvidenceGrid / AnalysisTab / dossier-evidence work from `fc45b70` into a clean branch. No legacy cleanup, no chrome (PR-FE-1), no audit/compliance (PR-FE-6), no `_handoff`, no `design-system`, no temp files, no `next.config.js`.

---

## STATUS: DONE

## SOURCE COMMIT fc45b70 — full file set (7) and classification
| File | Classification | In this PR |
|---|---|---|
| `components/credit-hub/primitives/EvidenceGrid.tsx` | INCLUDE_EVIDENCE_GRID | ✅ |
| `components/credit-hub/bank/sections/AnalysisTab.tsx` | INCLUDE_EVIDENCE_GRID | ✅ |
| `lib/credit-hub/ch-types.ts` | INCLUDE (evidence types only) | ✅ |
| `lib/credit-hub/i18n/locales/es-DO/credit-hub.ts` | INCLUDE_EVIDENCE_GRID (i18n `evidence.*`) | ✅ |
| `lib/credit-hub/types/bank-views.ts` | INCLUDE_EVIDENCE_GRID (dossier `identity`) | ✅ |
| `tests/credit-hub/primitives/EvidenceGrid.test.tsx` | INCLUDE_EVIDENCE_GRID | ✅ |
| `tsconfig.json` | EXCLUDE (REVIEW_REQUIRED) | ❌ |

## FILES INCLUDED (6)
- `components/credit-hub/primitives/EvidenceGrid.tsx` — renders real identity evidence (liveness/face-match/cédula) instead of hardcoded "INE validada. Biometría concordante."
- `components/credit-hub/bank/sections/AnalysisTab.tsx` — passes dossier `identity` into `EvidenceGrid`.
- `lib/credit-hub/ch-types.ts` — adds `IdentityEvidence` interface and `EvidenceGridProps.identity`. **Applied via 3-way cherry-pick onto current main**, so PR #145 chrome types (`ChTopbarProps`, `ChSidebarProps`, `notifications`, `onSelectTenant`, etc.) are preserved (verified present) and only the evidence types were added. No chrome regression.
- `lib/credit-hub/i18n/locales/es-DO/credit-hub.ts` — adds `evidence.*` block (18 keys: cédula, liveness, face-match, provider, evidence id, identity title/pending).
- `lib/credit-hub/types/bank-views.ts` — adds `identity?: IdentityEvidence` to `BankReviewPayload`.
- `tests/credit-hub/primitives/EvidenceGrid.test.tsx` — 10 tests for the new evidence rendering.

## FILES EXCLUDED
- `tsconfig.json` — fc45b70's only change was adding `"_handoff"` to the `exclude` array. This is an unrelated build-config tweak (not EvidenceGrid/dossier work) and the task scope/abort-list flags `_handoff`. **Excluded** to keep the PR pure. (The recurring `_handoff` typecheck noise was instead handled by temporarily moving `_handoff/` out of the repo during typecheck/build — a separate infra concern that could be its own PR.)
- All other fc45b70-unrelated areas were never in the commit (no legacy `/credit/*`, no chrome components, no PR-FE-6 audit/compliance, no `design-system`, no temp files).

## REAL BACKEND / API DATA PATH
- `AnalysisTab` consumes the bank application dossier (`BankReviewPayload`) and forwards `payload.identity` (typed `IdentityEvidence`) to `EvidenceGrid`'s new `identity` prop.
- `IdentityEvidence` mirrors the dossier's antispoofing evidence: `liveness` (status, `pad_score`, provider, `evidence_id`, `checked_at`), `face_match` (status, score, provider), and `cedula` (verified, `document_id`, `extracted_name`).
- `EvidenceGrid` renders these with color-coded confidence and i18n strings — no hardcoded identity claims.

## FALLBACK BEHAVIOR
- When `identity` (or any sub-field) is absent/null, the grid shows non-misleading fallbacks (`evidence.identity_pending` = "Verificación de identidad pendiente"; per-field "no aplicable"/"requiere revisión"), never a fake "validated" claim. Scores render only when present (`score != null`).

## HYPOTHESIS RESULTS
| # | Hypothesis | Result | Evidence |
|---|---|---|---|
| H1 | fc45b70 is valid EvidenceGrid/dossier work | **TRUE** | Replaces hardcoded identity text with dossier-driven `IdentityEvidence` + 10 tests |
| H2 | fc45b70 separable into clean branch from updated main | **TRUE** | `git cherry-pick -n` applied cleanly (ch-types auto-merged, no conflict) |
| H3 | Diff = only EvidenceGrid/AnalysisTab/dossier types/i18n/test | **TRUE** | 6 files, all in that scope |
| H4 | No reintroduction of PR #149-deleted legacy files | **TRUE** | No `app/credit/*`, `app/(dealer)/*`, `DashboardLayout` in diff |
| H5 | No `next.config.js`/PR-FE-1/PR-FE-6/`_handoff`/`design-system` | **TRUE** | abort-list grep on staged files → empty |
| H6 | Tests/typecheck/build pass | **TRUE** | typecheck/lint/build green; EvidenceGrid 10/10 |
| H7 | Abort if legacy/chrome appears in diff | **N/A (not triggered)** | No legacy/chrome in diff |

All hypotheses passed → proceeded.

## TESTS RUN
- `npm run typecheck` → **PASS** (`tsc --noEmit`, exit 0).
- `npm run lint` → **PASS** (eslint scoped, `--max-warnings 0`, exit 0).
- `npm run build` → **PASS** (`next build`, exit 0).
- Targeted jest:
  - `tests/credit-hub/primitives/EvidenceGrid.test.tsx` → **PASS** (10/10).
  - `AnalysisTab` / `bank-application-detail` / `bank/sections` → **60/60 passed across 17 suites**.
  - 1 suite failed to load — `tests/bank-application-detail/page.test.tsx` — due to a **pre-existing, unrelated** Jest/ESM issue with the `react-pdf` dependency (`Cannot use import statement outside a module` in `node_modules/react-pdf/dist/index.js`, imported by the PDF preview in `app/(bank)/bank/applications/[id]/page.tsx`). None of this PR's files import `react-pdf`; not a regression.
- Note: pre-existing untracked `_handoff/` was temporarily moved out during typecheck/build and restored afterward — not part of this PR.

## RISK
**LOW.** Additive, scoped EvidenceGrid/dossier change; `ch-types.ts` 3-way merge verified to preserve chrome types; no legacy/chrome/config contamination; explicit non-misleading fallbacks. The only red test is a pre-existing `react-pdf` Jest config issue unrelated to this change.

## RECOMMENDATION
**APPROVE / MERGE.** Optional follow-ups (separate PRs): add `react-pdf` to Jest `transformIgnorePatterns` to fix the pre-existing PDF page-test load failure; and a small infra PR to add `_handoff` to `tsconfig.json` `exclude` (the change deliberately omitted here).
