# Credit Hub Forge — migration notes

## Dealer wizard: legacy `WizardContainer` vs five-segment Forge wizard (Phase 4 chunk 3)

- **Production Forge route:** `/credit-hub/dealer/applications/new` redirects to **`/credit-hub/dealer/applications/new/applicant`** and serves the **five-segment** flow (`DealerWizardProvider` + step `page.tsx` files under `applications/new/*`). The legacy **`<WizardContainer />` UI is not mounted** on these routes anymore.
- **Legacy component:** `components/credit-hub/dealer/wizard/WizardContainer.tsx` **remains in the repo** as the **seven-step** animated wizard (exports `WizardContainer`, `buildCreateApplicationPayload`, `stepIsValid`, `initialApplicationFormData`, etc.). It is still referenced by **unit tests** (`tests/credit-hub/content/wizard/WizardContainer.test.tsx`) and by **composition imports** from the new Forge wizard (shared payload/validation).
- **Deferral (Phase 7 / cleanup):** either delete `WizardContainer` once tests are rewritten against the segmented flow, or keep a thin “preview” route for QA only — **no second production URL** is required today because the Forge segmented wizard is the only dealer entry under `/credit-hub/dealer/applications/new`.

## Dealer application detail URLs

Use **`forgeDealerApplicationDetailHref()`** from `lib/credit-hub/dealerRoutes.ts` for all links to `/credit-hub/dealer/applications/[id]`. Relative hrefs such as `dealer/applications/<id>` from a page at `/credit-hub/dealer` resolve to **`/credit-hub/dealer/dealer/applications/<id>`** (double `dealer` → 404).
