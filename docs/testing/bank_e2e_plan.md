# Bank console — Playwright E2E (Phase A Agent-4)

This document describes **`e2e/bank/`** + **`playwright.config.bank.ts`**: stipulation workflow (orchestration + admin), T6.1 document preview, Forge bank queue (`/credit-hub/bank/applications`), and classic application detail (`/bank/applications/[id]`).

## Strategy

1. **Auth + tenant** — Tests call `setupBankSession` (`e2e/bank/bank-e2e-helpers.ts`) to populate `nadakki_sic_token` (JWT with `tid`), `nadakki_auth`, `nadakki_tenant_id`, and `nadakki_role=admin` so **TENANT_ADMIN** stipulation mutations work.
2. **Deterministic API** — `page.route` stubs same-origin `/api/v2/credit/**` calls. Credit Hub Forge fetches use the dashboard origin; adjust `E2E_BASE_URL` to match your deployment.
3. **Feature flags** — Orchestration UI is **off** unless `NEXT_PUBLIC_BANK_STIPULATION_WORKFLOW_UI=true` at build time; document preview defaults **on** unless `NEXT_PUBLIC_FEATURE_DOCUMENT_PREVIEW_UI=off`. Tests **skip** when the gated control is missing.
4. **Fixtures** — Synthetic PDFs live in `e2e/fixtures/sample-documents/` (generated placeholders, no real PII). The `sample-large.pdf` artifact is **~3MB** multi-page synthetic; tests that mention 10MB+ may expand the response in-memory or refer to chunked loading (see large PDF test).

## Coverage matrix

| Suite | Desktop | Mobile (iPhone SE project) |
| ----- | ------- | ---------------------------- |
| `test_stipulations_workflow_e2e.spec.ts` | Primary | Skipped |
| `test_document_preview_e2e.spec.ts` | Primary | Skipped |
| `test_bank_application_flow_e2e.spec.ts` | Primary | Skipped |
| `test_mobile_responsive.spec.ts` | Skipped | Primary |

## How to run

```powershell
npx playwright install
$env:E2E_BASE_URL="https://dashboard.nadakki.com"
npx playwright test --config=playwright.config.bank.ts --project=chromium-desktop
```

All projects (including mobile device profiles):

```powershell
npx playwright test --config=playwright.config.bank.ts
```

## Test data & cleanup

- Application IDs are fixed UUIDs per spec (e.g. `…a601`, `…d901`); no shared database cleanup is required when routes mock responses.
- Stipulation rows and queue rows are **mock JSON** only.

## Related UI

| Area | Location |
| ---- | -------- |
| Document preview | `components/bank/DocumentPreviewPane.tsx` |
| Workflow orchestration | `components/bank/BankWorkflowOrchestrationModal.tsx` |
| Stipulations admin | `app/(bank)/bank/applications/[id]/stipulations/` |
| Bank queue (Forge) | `app/(forge)/credit-hub/bank/applications/page.tsx` |
| Classic detail | `app/(bank)/bank/applications/[id]/page.tsx` |
