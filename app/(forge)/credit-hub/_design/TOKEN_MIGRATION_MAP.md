# Forge — Token migration map (Phase 1.5)

**Branch:** `feat/forge-redesign-v3`  
**Purpose:** Single source of truth for migrating legacy Tailwind `forge-*` utilities to v3.2 semantic tokens, without two unrelated color systems in production.

## Inventory

- **Raw extract:** `_design/_inventory/legacy_utilities_raw.txt`
- **Method:** `app/` + `components/`, `*.ts` / `*.tsx`, one row per **regex match** of `(bg|text|border|ring|from|to|via)-forge-[a-z-]+`.
- **Count:** **720** match rows across **78** files (strict per-occurrence count; earlier “~542” figures were approximate pre-inventory rollups).

---

## Section A — Direct 1:1 mapping (prescribed table)

Use this table when replacing classnames in Phase 4. The **v3.2** column lists the Tailwind theme keys added in Phase 1 (`forgeBrand`, `forgeInk`, `forgeSurface`, semantic scales, etc.).

| Legacy utility               | v3.2 utility                  | Reason          |
|------------------------------|-------------------------------|-----------------|
| bg-forge-bg                  | bg-forgeSurface-page          | Renamed         |
| bg-forge-surface             | bg-forgeSurface-card          | Renamed         |
| bg-forge-surface-elevated    | bg-forgeSurface-raised        | Renamed         |
| bg-forge-surface-hover       | bg-forgeSurface-sunken        | Renamed         |
| bg-forge-primary             | bg-forgeBrand-500             | Renamed         |
| bg-forge-danger              | bg-forgeDanger-500            | Added scale     |
| bg-forge-warning             | bg-forgeWarning-500           | Added scale     |
| bg-forge-success             | bg-forgeSuccess-500           | Added scale     |
| bg-forge-info                | bg-forgeInfo-500              | Added scale     |
| bg-forge-border              | bg-forgeInk-200               | Renamed         |
| text-forge-primary           | text-forgeBrand-500           | Renamed         |
| text-forge-accent            | text-forgeAccent-gold         | Renamed         |
| text-forge-bg                | text-forgeSurface-page        | Renamed (rare)  |
| text-forge-text              | text-forgeInk-800             | Renamed         |
| text-forge-text-muted        | text-forgeInk-500             | Renamed         |
| text-forge-text-subtle       | text-forgeInk-400             | Renamed         |
| text-forge-danger            | text-forgeDanger-500          | Added scale     |
| text-forge-warning           | text-forgeWarning-500         | Added scale     |
| text-forge-success           | text-forgeSuccess-500         | Added scale     |
| text-forge-info              | text-forgeInfo-500            | Added scale     |
| border-forge-border          | border-forgeInk-200           | Renamed         |
| border-forge-border-hover    | border-forgeInk-300           | Renamed         |
| border-forge-primary         | border-forgeBrand-500         | Renamed         |
| ring-forge-primary           | ring-forgeBrand-500           | Renamed         |
| border-forge-danger          | border-forgeDanger-500        | Added scale     |
| border-forge-warning         | border-forgeWarning-500       | Added scale     |
| border-forge-success         | border-forgeSuccess-500       | Added scale     |
| border-forge-info            | border-forgeInfo-500          | Added scale     |

**Tailwind adapter (Phase 1.5):** Legacy utilities listed above still compile, but their **computed color** prefers v3.2 CSS variables when defined on `.forge-app`, with **fallback** to `styles/forge-tokens.css` portal variables. See `tailwind.config.js` comment block `LEGACY ALIASES`.

---

## Section B — Gradient utilities (remove in Phase 4)

v3.2 forbids brand-forward gradients on institutional surfaces. These **8** gradient stops must be removed during Phase 4 page migration and replaced with **flat** surface + border tokens.

### `from-forge-primary`

| File | Flat replacement (proposal) | Visual impact |
|------|------------------------------|---------------|
| `app/(forge)/credit-hub/dealer/applications/page.tsx` | `bg-forgeSurface-card border border-forgeInk-200` | Medium |
| `app/(forge)/credit-hub/page.tsx` | Same | Medium |
| `components/credit-hub/dealer/analysis/CreditAnalysisPanel.tsx` | Same | High |
| `components/credit-hub/dealer/preapproval/SimulatorResults.tsx` | Same | Medium |
| `components/credit-hub/dealer/wizard/WizardContainer.tsx` | Same | High |
| `components/credit-hub/dealer/ForgeMetricCard.tsx` | Same | High |
| `components/credit-hub/navigation/DealerBottomNav.tsx` | Same | High |
| `components/credit-hub/primitives/ForgeButton.tsx` | Solid `bg-forgeBrand-500` + `hover:bg-forgeBrand-600` | High |
| `components/credit-hub/primitives/ForgeProgress.tsx` | Single `bg-forgeBrand-500` track + neutral track | Medium |

### `to-forge-primary` / `to-forge-primary-hover`

| File | Notes | Visual impact |
|------|-------|---------------|
| `components/credit-hub/bank/BankDashboardHero.tsx` | Paired with `from-forge-surface`, `via-forge-surface`, `to-forge-primary` | High |
| `components/credit-hub/dealer/ForgeMetricCard.tsx` | Paired with `from-forge-primary` | High |
| `app/(forge)/credit-hub/dealer/applications/page.tsx` | With `to-forge-primary-hover` | Medium |
| `components/credit-hub/navigation/DealerBottomNav.tsx` | With `to-forge-primary-hover` | High |
| `components/credit-hub/primitives/ForgeButton.tsx` | With `to-forge-primary-hover` | High |

### `to-forge-accent`

| File | Notes | Visual impact |
|------|-------|---------------|
| `app/(forge)/credit-hub/page.tsx` | Hero gradient | Medium |
| `components/credit-hub/dealer/analysis/CreditAnalysisPanel.tsx` | Panel header | High |
| `components/credit-hub/dealer/wizard/WizardContainer.tsx` | Progress bar | High |
| `components/credit-hub/dealer/ForgeMetricCard.tsx` | Hover / bar fills | High |
| `components/credit-hub/primitives/ForgeProgress.tsx` | Bar gradient | Medium |

### `from-forge-surface` / `to-forge-surface` / `via-forge-surface`

| File | Notes | Visual impact |
|------|-------|---------------|
| `components/credit-hub/bank/BankDashboardHero.tsx` | Hero `bg-gradient-to-br` | High |

### `via-forge-surface-elevated`

| File | Notes | Visual impact |
|------|-------|---------------|
| `components/credit-hub/primitives/ForgeSkeleton.tsx` | Shimmer skeleton — replace with flat `bg-forgeSurface-sunken` + subtle border; keep reduced-motion | Low |

---

## Section C — Structural / component tokens (deferred to Phase 7)

These are **not** matched by the inventory regex (`bg|text|border|ring|from|to|via)-forge-*`. They remain defined in `styles/forge-tokens.css` (and partially duplicated under `.forge-app` in `_design/tokens.css`) until consumers migrate and `forge-tokens.css` can be deleted.

| Pattern | Usage / location | Phase |
|---------|------------------|-------|
| `--forge-space-*` CSS variables | `styles/forge-tokens.css` `:root`; `lib/credit-hub/design/tokens.ts` exports `forgeSpacing` (**no current TSX imports** of `forgeSpacing`) | Phase 7 cleanup |
| `--forge-radius-*` CSS variables | `styles/forge-tokens.css`; `lib/credit-hub/design/tokens.ts` `forgeRadius` export (same: **no TSX imports**) | Phase 7 cleanup |
| `--forge-font-*` (legacy portal) | Set by `next/font` + `_design/tokens.css` on `.forge-app` | Phase 7 alignment |
| `animate-forge-pulse-slow` | `components/credit-hub/brand/ForgeLoadingMark.tsx` | Phase 7 |
| `animate-forge-shimmer` | `components/credit-hub/primitives/ForgeSkeleton.tsx` (+ `tailwind.config.js` keyframes) | Phase 7 |
| `animate-forge-float` | Defined in `tailwind.config.js` only (no TSX matches in `app/` + `components/`) | Phase 7 |
| `forge-button` / `forge-input` / `forge-select` | **Not** Tailwind utilities — `data-testid` / DOM id prefixes in primitives (`ForgeButton`, `ForgeInput`, `ForgeSelect`) | N/A (rename only if QA convention changes) |

---

## Section D — Files affected by migration (checklist)

Sorted by **legacy utility occurrence count** (from `legacy_utilities_raw.txt`). **Phase 4 priority:** heuristic from density — wizard / consent / bank decision flows first.

| File | Legacy uses | Phase 4 priority |
|------|-------------|------------------|
| `components/credit-hub/dealer/wizard/WizardContainer.tsx` | 103 | High |
| `components/credit-hub/dealer/analysis/CreditAnalysisPanel.tsx` | 29 | High |
| `components/credit-hub/dealer/ApplicationCard.tsx` | 27 | High |
| `components/credit-hub/dealer/ApplicationStatusBadge.tsx` | 24 | High |
| `components/credit-hub/dealer/wizard/consent/ConsentSection.tsx` | 22 | High |
| `components/credit-hub/dealer/preapproval/SimulatorResults.tsx` | 21 | High |
| `components/credit-hub/dealer/wizard/consent/PresentConsentForm.tsx` | 20 | High |
| `components/credit-hub/dealer/wizard/consent/SMSOTPConsentMethod.tsx` | 19 | High |
| `components/credit-hub/dealer/ForgeMetricCard.tsx` | 18 | High |
| `components/credit-hub/dealer/analysis/ScoreVisual.tsx` | 18 | High |
| `components/credit-hub/dealer/analysis/CapacitySnapshot.tsx` | 17 | High |
| `components/credit-hub/dealer/analysis/RecommendationCard.tsx` | 16 | High |
| `components/credit-hub/primitives/ForgeBadge.tsx` | 15 | High |
| `components/credit-hub/dealer/wizard/consent/ConsentStatusPoller.tsx` | 14 | Medium |
| `components/credit-hub/bank/BankComplianceReport.tsx` | 13 | Medium |
| `components/credit-hub/primitives/ForgeButton.tsx` | 12 | Medium |
| `components/credit-hub/bank/BankCounterOfferModal.tsx` | 12 | Medium |
| `components/credit-hub/dealer/wizard/consent/RemoteConsentSelector.tsx` | 12 | Medium |
| `components/credit-hub/dealer/analysis/PaymentBreakdown.tsx` | 12 | Medium |
| `components/credit-hub/primitives/ForgeInput.tsx` | 11 | Medium |
| `components/credit-hub/dealer/analysis/RiskFactorsList.tsx` | 11 | Medium |
| `app/(forge)/credit-hub/dealer/applications/page.tsx` | 11 | Medium |
| `components/credit-hub/navigation/DealerTopBar.tsx` | 11 | Medium |
| `components/credit-hub/dealer/wizard/consent/WhatsAppConsentMethod.tsx` | 9 | Medium |
| `components/credit-hub/bank/BankApplicationCard.tsx` | 9 | Medium |
| `components/credit-hub/dealer/wizard/consent/SelfieConsentMethod.tsx` | 9 | Medium |
| `components/credit-hub/system/ForgeToaster.tsx` | 9 | Medium |
| `components/credit-hub/primitives/ForgeSelect.tsx` | 9 | Medium |
| `components/credit-hub/dealer/wizard/consent/EmailConsentMethod.tsx` | 9 | Medium |
| `components/credit-hub/bank/BankComplianceCard.tsx` | 9 | Medium |
| `components/credit-hub/bank/BankDashboardHero.tsx` | 9 | Medium |
| `components/credit-hub/bank/BankDecisionForm.tsx` | 8 | Medium |
| `app/(forge)/credit-hub/page.tsx` | 8 | Medium |
| `components/credit-hub/navigation/DealerBottomNav.tsx` | 8 | Medium |
| `components/credit-hub/primitives/ForgeCard.tsx` | 8 | Medium |
| `components/credit-hub/bank/BankDetailView.tsx` | 8 | Medium |
| `components/credit-hub/dealer/preapproval/ScenarioComparison.tsx` | 7 | Low |
| `app/(forge)/credit-hub/bank/audit/page.tsx` | 7 | Low |
| `components/credit-hub/bank/navigation/BankTopBar.tsx` | 6 | Low |
| `components/credit-hub/bank/navigation/BankSideNav.tsx` | 6 | Low |
| `components/credit-hub/system/CHTenantGuard.tsx` | 6 | Low |
| `components/credit-hub/bank/BankBulkActionConfirm.tsx` | 6 | Low |
| `components/credit-hub/bank/BankDealerRanking.tsx` | 6 | Low |
| `components/credit-hub/dealer/preapproval/SimulatorControls.tsx` | 5 | Low |
| `components/credit-hub/dealer/preapproval/RecommendationsList.tsx` | 5 | Low |
| `components/credit-hub/bank/BankAuditTimeline.tsx` | 5 | Low |
| *(…remaining 33 files with ≤4 uses each — see `_inventory/file_table_fragment.md` for full machine list.)* | | Low |

---

## Section E — Decisions log (Phase 1.5)

1. **Backwards-compat adapter** — `tailwind.config.js` legacy `forge-*` color entries now use `var(<v3.2>, var(<legacy portal>))` so **on `.forge-app`** legacy utilities match v3.2 semantic variables; **outside** `.forge-app`, legacy portal colors from `styles/forge-tokens.css` still apply. The `LEGACY ALIASES` comment marks this block for **Phase 7 removal** once classnames are migrated per Sections A–B.

2. **`DEFAULT_CREDIT_TENANT_ID`** — **Resolved (Cesar 2026-05-01):** `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` is the **canonical Credicefi** Credit Core fallback (JSDoc on `lib/credit-hub/types/creditCore.ts`; `@deprecated` removed). Banco Piloto RD pilot UUID for Credit remains documented as **`550e8400-e29b-41d4-a716-446655440099`** in backend docs only. See **`BLOCKER_phase1.5.md`** (status RESOLVED) and **`CROSS_CORE_FINDINGS.md`** for the separate `366b3c6c…` cross-core note.

3. **Dealer dark mode (v3.2)** — The `.forge-app [data-portal="dealer"]` override block in `_design/tokens.css` is **commented dormant** per Cesar 2026-05-01. Re-enable in one diff when Phase 4 approves dealer dark on v3.2 semantics. Documented under **Deferred decisions** in `TENANT_CONTEXT_EXTENSION.md`.

---

## Verification (Phase 1.5 gate)

| Check | Result |
|-------|--------|
| `_design/_inventory/legacy_utilities_raw.txt` exists | **Yes** — **720** lines (per-utility matches; ± drift vs older 542 rollup is expected). |
| `TOKEN_MIGRATION_MAP.md` sections A–E | **Yes** |
| `npm run build` | **Yes** — `exit_code: 0` (Next 16.2.4 webpack, 2026-05-01 agent run). |
| Spot-check “identical computed color” | **Interpretation:** On routes wrapped by `.forge-app`, `bg-forge-primary` and `bg-forgeBrand-500` both resolve through `var(--forge-brand-500, …)` to the **same** computed sRGB when `--forge-brand-500` is defined. **Manual DevTools** comparison recommended on: (1) `/credit-hub/bank` — bank queue; (2) `/credit-hub/dealer` — dealer dashboard; (3) `/credit-hub/dealer/applications/new` — wizard shell. Automated before/after screenshots were not captured in this agent run. |
| `DEFAULT_CREDIT_TENANT_ID` | **Resolved** — canonical Credicefi; see `BLOCKER_phase1.5.md` + `creditCore.ts` JSDoc. |
| Dealer dormant CSS | **Yes** — wrapped in comment block in `_design/tokens.css` |
| Forbidden paths | **Untouched** — `app/legal/**`, `app/marketing/**`, `app/sic/**`, `vercel.json`, `next.config.js`, `contexts/TenantContext.tsx`, `lib/credit-hub/hooks/useTenant.ts` |

---

*End of Phase 1.5 token migration map. Phase 2 proceeds per master prompt v3.2.*
