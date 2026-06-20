# PR #150 Review — EvidenceGrid: Connect Real Dossier Data

**PR:** https://github.com/csorianoai/nadakki-dashboard/pull/150
**Branch:** `fix/evidence-grid-real-dossier-data`
**Base:** `origin/main` @ `e79e1e6`
**Prerequisite:** PR #149 (PR-LEGACY-3) — **MERGED**. ✅
**Mode:** review + follow-up fix applied on the same branch (no merge, no new PR).

---

## STATUS: DONE
## VERDICT: LOW
## RECOMMENDATION: APPROVE

Initial review found the PR clean in scope/types/i18n but flagged a **MEDIUM integration gap**: `AnalysisTab` passed both `items` and `identity`, and `EvidenceGrid` ignored `identity` whenever `items` was present — so real dossier identity evidence never rendered in the bank analysis tab. **That gap has now been fixed on this branch** (commit `fix(credit-hub): render identity evidence with explicit evidence items`). Re-verified: identity evidence now renders alongside explicit items; verdict upgraded to **LOW / APPROVE**.

---

## INTEGRATION FIX APPLIED
**Before (buggy):**
```ts
if (items) { data = items; }            // identity dropped when items present
else { data = [...DEFAULT_ITEMS]; if (identity) data.push(...buildIdentityItems(identity)); }
```
**After (fixed):**
```ts
const data: EvidenceItem[] = items ? [...items] : [...DEFAULT_ITEMS];
if (identity) { data.push(...buildIdentityItems(identity)); }
```
- `items` + `identity` → explicit items **and** identity-derived items (the AnalysisTab case). ✅
- `items` only → items. ✅
- `identity` only → `DEFAULT_ITEMS` + identity items. ✅
- neither → `DEFAULT_ITEMS`. ✅ (no crash when identity absent)
- No `INE validada` restored; scores still only render when non-null; honest "pendiente" fallback retained.

`AnalysisTab` needed **no change** — it already passes `items` + `identity={payload.identity}` and no longer contains the fake "Identidad y PLD" card; with the component fix it now surfaces the real dossier identity evidence.

## 1. Diff scope — PASS
7 files (vs `origin/main`): `EvidenceGrid.tsx`, `AnalysisTab.tsx`, `ch-types.ts`, `i18n/es-DO/credit-hub.ts`, `bank-views.ts`, `tests/credit-hub/primitives/EvidenceGrid.test.tsx`, `docs/audits/PR_EVIDENCE_GRID_REAL_DOSSIER_DATA_REPORT.md` (+ this review). All within the allowed set.

## 2. Exclusions — PASS
None present: `app/credit/*`, `app/(dealer)/*`, `DashboardLayout.tsx`, `next.config.js`, `tsconfig.json`, `Ch*` chrome, `useChromeIdentity`, `Bank/DealerChShell`, `useBankAuditCompliance`, bank audit/compliance pages, `_handoff/`, `design-system/`, `.tmp-*`, `.pr-body-*`, `.gitignore`. No PR #149-deleted legacy reintroduced.

## 3. EvidenceGrid behavior — PASS (after fix)
- Real identity data rendered when present (cédula/liveness/face-match); merged with explicit items. ✅
- No invented scores (`score != null` guards). ✅
- Honest fallback ("Verificación de identidad pendiente") when identity present but empty. ✅
- No crash when identity absent. ✅
- No silent mock; no `INE validada` hardcode. ✅

## 4. AnalysisTab integration — PASS (after fix)
- Passes `identity={payload.identity}` from `BankReviewPayload`; fake identity card removed; existing sections intact; no impact on global audit/compliance. ✅
- Real dossier identity evidence now renders (component fix). ✅

## 5. Type safety — PASS
`IdentityEvidence`, `EvidenceGridProps.identity`, `BankReviewPayload.identity` added correctly. **PR #145 chrome types preserved** (`ChTopbarProps`/`ChSidebarProps`/`ChAppShellProps`/`onSelectTenant`/`navBadges`). typecheck clean.

## 6. i18n — PASS
18 `evidence.*` keys additive; no existing keys removed. (Component still renders inline Spanish strings; consuming the keys is an optional follow-up — non-blocking.)

## 7. Tests — PASS
- `npm run typecheck` → **PASS** (exit 0).
- `npm run lint` → **PASS** (exit 0).
- `npm run build` → **PASS** (exit 0).
- `tests/credit-hub/primitives/EvidenceGrid.test.tsx` → **PASS (10/10)**, including the updated test (renamed) **"renders explicit items AND identity-derived items when both are passed"**, which now asserts that with `items` + `identity` both render (`Custom item` + `Verificacion biometrica` + 95% liveness score; `titles.length === 2`).
- AnalysisTab/bank-sections: no regressions.

## 8. React-pdf suite — PREEXISTING_INFRA · NOT_CAUSED_BY_PR_150 · FOLLOW_UP_PR_REQUIRED
`tests/bank-application-detail/page.test.tsx` fails to load (`react-pdf` ESM `Cannot use import statement outside a module`). None of the PR's files import `react-pdf` (verified); failing file not in diff. Non-blocking. Fix via Jest `transformIgnorePatterns` in a separate infra PR.

## HYPOTHESES (fix task)
| # | Hypothesis | Result |
|---|---|---|
| H1 | Correct fix = combine explicit items + identity-derived items | **TRUE** (implemented) |
| H2 | No `INE validada` fake card returns | **TRUE** |
| H3 | No invented scores | **TRUE** |
| H4 | Identity-absent case not broken | **TRUE** |
| H5 | No legacy/PR-FE-1/PR-FE-6/next.config/_handoff/design-system/tsconfig touched | **TRUE** |
| H6 | Old "prefers items over identity" test updated (that was the bug) | **TRUE** (renamed + asserts both render) |

## 9. Risk — LOW
Minimal, contained change in one component + one test; behavior now matches intent; all builds/tests green; no scope contamination; PR #145 preserved. Only residual is the pre-existing, unrelated react-pdf Jest config issue.

## 10. Recommendation — APPROVE
Integration corrected: identity evidence now renders in `AnalysisTab` when `items` + `identity` are both provided. Tests pass; react-pdf remains unrelated/pre-existing. Ready to merge. Optional follow-ups: react-pdf `transformIgnorePatterns`; consume `evidence.*` i18n keys in `EvidenceGrid`; `tsconfig` `_handoff` exclude.

---

## FINAL OUTPUT

STATUS: DONE
VERDICT: LOW
RECOMMENDATION: APPROVE
FILES VERIFIED: EvidenceGrid.tsx, AnalysisTab.tsx, ch-types.ts, i18n es-DO, bank-views.ts, EvidenceGrid.test.tsx, + reports.
FIX APPLIED: EvidenceGrid now uses `items` (or defaults) as base and always appends identity-derived items when `identity` is present → AnalysisTab renders explicit items AND real dossier identity evidence.
EVIDENCEGRID CHECK: real data merged with items, no invented scores, honest fallback, no crash, no INE hardcode.
ANALYSISTAB CHECK: passes real `payload.identity`; fake card removed; identity now rendered (no AnalysisTab change needed).
TYPE SAFETY: types added correctly; PR #145 chrome preserved.
I18N CHECK: 18 `evidence.*` keys additive; no removals.
TESTS: typecheck PASS · lint PASS · build PASS · EvidenceGrid 10/10 (updated test asserts both render).
REACT_PDF SUITE CLASSIFICATION: PREEXISTING_INFRA + NOT_CAUSED_BY_PR_150 + FOLLOW_UP_PR_REQUIRED.
RISKS: LOW.
FINAL DECISION: APPROVE.
