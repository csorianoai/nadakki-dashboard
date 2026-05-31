# Bank console — Playwright E2E (Phase A Agent-4)

This document describes **`e2e/bank/`**, **`tests/integration/bank/`**, and **`playwright.config.bank.ts`**: stipulation workflow (request, fulfill, audit), T6.1 document preview, bank mobile UI, Forge bank queue (`/credit-hub/bank/applications`), and classic application detail (`/bank/applications/[id]`).

## Strategy

1. **Preview-first target** — `playwright.config.bank.ts` resolves `VERCEL_BRANCH_URL` / `VERCEL_URL` first, then `E2E_BASE_URL`, then local `http://127.0.0.1:3000`. It throws if pointed at production `dashboard.nadakki.com`.
2. **Auth + tenant** — Tests call `setupBankSession` (`e2e/bank/bank-e2e-helpers.ts`) to populate `nadakki_sic_token` (JWT with `tid`), `nadakki_auth`, `nadakki_tenant_id`, and `nadakki_role=admin` so **TENANT_ADMIN** stipulation mutations work.
3. **Deterministic API** — `page.route` stubs same-origin `/api/v2/credit/**` calls. Stipulation mocks are stateful enough for verify/reject mutations to remain visible after SWR revalidation.
4. **Feature flags** — Orchestration UI is **off** unless `NEXT_PUBLIC_BANK_STIPULATION_WORKFLOW_UI=true` at build time; document preview defaults **on** unless `NEXT_PUBLIC_FEATURE_DOCUMENT_PREVIEW_UI=off`. Tests **skip** when the gated control is missing.
5. **Fixtures** — Synthetic PDFs live in `e2e/fixtures/sample-documents/` (generated placeholders, no real PII). `sample-multi.pdf` drives multi-page navigation and side-by-side comparison; `sample-large.pdf` covers progressive loading.

## Coverage matrix

| Suite | Desktop | Mobile / integration |
| ----- | ------- | -------------------- |
| `e2e/bank/test_stipulations_workflow_e2e.spec.ts` | Full request, fulfill, audit, templates, dealer notification, status UI | 375 px modal viewport smoke |
| `e2e/bank/test_document_preview_e2e.spec.ts` | PDF.js render, zoom, rotate, side-by-side, download, multi-page controls, loading/error | 390 px preview smoke |
| `e2e/bank/test_bank_application_flow_e2e.spec.ts` | Classic bank application flow | Skipped outside desktop |
| `e2e/bank/test_mobile_responsive.spec.ts` | Skipped outside mobile project | iPhone SE Playwright smoke |
| `tests/integration/bank/test_bank_flow_mobile.tsx` | Jest/jsdom component integration | 375 px, 414 px, 768 px, bank role UI |

## How to run

```powershell
npx playwright install
$env:VERCEL_BRANCH_URL="<your-pr-preview-host>.vercel.app"
npx playwright test --config=playwright.config.bank.ts --project=chromium-desktop
```

All projects (including mobile device profiles):

```powershell
npx playwright test --config=playwright.config.bank.ts
```

Bank mobile integration:

```powershell
npx jest --testMatch "**/tests/integration/bank/test_bank_flow_mobile.tsx"
```

Local app fallback:

```powershell
$env:E2E_BASE_URL="http://127.0.0.1:3000"
npx playwright test --config=playwright.config.bank.ts --project=chromium-desktop
```

## Test data & cleanup

- Application IDs are fixed UUIDs per spec (e.g. `…a601`, `…d901`); no shared database cleanup is required when routes mock responses.
- Stipulation rows and queue rows are **mock JSON** only.
- PDF fixtures are synthetic and live under `e2e/fixtures/sample-documents/`.

## Interpreting Failures

- **Production URL error** — The config intentionally blocks `https://dashboard.nadakki.com`; rerun against the Vercel preview host or local dev server.
- **Workflow UI skipped** — The preview was built without `NEXT_PUBLIC_BANK_STIPULATION_WORKFLOW_UI=true`. This is a skip, not a failure.
- **Preview UI skipped** — The document preview button was absent, usually because `NEXT_PUBLIC_FEATURE_DOCUMENT_PREVIEW_UI=off` or the detail mock did not expose document `d1`.
- **Verify/reject status mismatch** — Inspect the mocked `/stipulations` route in `e2e/bank/bank-e2e-helpers.ts`; the E2E route must keep status changes stateful across SWR revalidation.
- **PDF rendering timeout** — Confirm Playwright can fetch the synthetic fixture and that PDF.js worker CSP is valid for the preview build.
- **Mobile integration failures** — These are jsdom component regressions in bank workflow or document preview controls, not backend/API failures.

## Related UI

| Area | Location |
| ---- | -------- |
| Document preview | `components/bank/DocumentPreviewPane.tsx` |
| Workflow orchestration | `components/bank/BankWorkflowOrchestrationModal.tsx` |
| Stipulations admin | `app/(bank)/bank/applications/[id]/stipulations/` |
| Bank queue (Forge) | `app/(forge)/credit-hub/bank/applications/page.tsx` |
| Classic detail | `app/(bank)/bank/applications/[id]/page.tsx` |
