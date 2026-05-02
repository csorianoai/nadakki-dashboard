# Credit Hub Forge — migration notes

## Dealer wizard: legacy `WizardContainer` vs five-segment Forge wizard (Phase 4 chunk 3)

- **Production Forge route:** `/credit-hub/dealer/applications/new` redirects to **`/credit-hub/dealer/applications/new/applicant`** and serves the **five-segment** flow (`DealerWizardProvider` + step `page.tsx` files under `applications/new/*`). The legacy **`<WizardContainer />` UI is not mounted** on these routes anymore.
- **Legacy component:** `components/credit-hub/dealer/wizard/WizardContainer.tsx` **remains in the repo** as the **seven-step** animated wizard (exports `WizardContainer`, `buildCreateApplicationPayload`, `stepIsValid`, `initialApplicationFormData`, etc.). It is still referenced by **unit tests** (`tests/credit-hub/content/wizard/WizardContainer.test.tsx`) and by **composition imports** from the new Forge wizard (shared payload/validation).
- **Deferral (Phase 7 / cleanup):** either delete `WizardContainer` once tests are rewritten against the segmented flow, or keep a thin “preview” route for QA only — **no second production URL** is required today because the Forge segmented wizard is the only dealer entry under `/credit-hub/dealer/applications/new`.

## Dealer application detail URLs

## Phase 7 Item 7.2 — legacy Tailwind adapter (**FINAL — Case B**)

**Consumer analysis:** `Get-ChildItem` on `app/` + `components/` excluding `components/credit-hub/**`, matching `from ['"]@/components/credit-hub` → **`_design/_inventory/credit_hub_consumers_grep.txt`** (repo root; mirror under `app/(forge)/credit-hub/_design/_inventory/`).

**Classification:** **Case B** — `components/credit-hub/**` is **actively imported** by Forge production routes (`app/(forge)/credit-hub/**`), **`app/(forge)/layout.tsx`** (`CHQueryProvider`), and **`components/forge/credit-hub/**` + `components/forge/layout/**`**. Jest suites under `tests/credit-hub/**` also import the same tree. The tree is **not** dead code.

**Resolution:** **`tailwind.config.js`** — LEGACY ALIASES block is **permanent** until primitives migrate to `components/forge/**`; comment documents removal criteria (grep empty outside `components/credit-hub`). **`styles/forge-tokens.css`** — **kept** (dual-var fallbacks for routes without full v3.2 scope).

**Verification (Phase 7 Item 7.2 close):** `npm run build` and `npx tsc --noEmit` green. Lighthouse accessibility-only on `/credit-hub/preview` → **`_design/_inventory/lh-credit-hub-preview-a11y-phase7-72.json`** (`categories.accessibility.score`: **0.97**). `npx @axe-core/cli …/credit-hub/preview --exit` exit **0**.

## Phase 7 — cleanup log (2026-04-29)

- **Motion:** `framer-motion` removed from dependencies; `lib/motion-stub.tsx` provides a zero-runtime compatibility layer for existing `motion.*` JSX. **`PullToRefresh`** rewritten with CSS `transform` / `opacity` + touch state.
- **Forge globals:** `forge-globals.css` imports only **`_design/tokens.css`**. Legacy **`styles/forge-tokens.css`** remains in the repo for non–Forge-app shells and Tailwind dual-var fallbacks (`tailwind.config.js` **PERMANENT LEGACY ALIASES** block — Item 7.2 Case B).
- **Tenant headline:** `BankDashboardHero` reads **`useTenantConfig().institution_name`** instead of a hardcoded brand string.


