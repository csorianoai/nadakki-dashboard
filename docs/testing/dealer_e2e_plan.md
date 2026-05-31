# Dealer flow — Playwright E2E plan (Phase A)

This document covers the **dealer zone** end-to-end tests (`e2e/dealer/`, `playwright.config.dealer.ts`) and frontend integration tests (`tests/integration/frontend/`): compressed credit wizard, App Health (T6.4), responsive / touch checks, and the Lighthouse mobile budget for PR previews.

## Strategy

1. **Preview-first navigation** — Playwright resolves `VERCEL_BRANCH_URL` / `VERCEL_URL` first, then `E2E_BASE_URL`, then local `http://127.0.0.1:3000`. Do not point dealer PR tests at production.
2. **Realistic sign-in** — Tests sign in through `/login` (email, password, tenant slug), then exercise `/credit/dealer/new` and `/credit/dealer/[applicationId]`.
3. **Deterministic API** — `e2e/dealer/helpers.ts` stubs `/api/v2/credit/**` from the browser so wizard submit and dealer command views work without a live Credit Core instance. Paths match any host (requests follow `NEXT_PUBLIC_API_URL`).
4. **JWT fixture** — `e2e/fixtures/dealer_jwt.json` carries the dealer mock claims used by preview E2E mocks. It is intentionally unsigned and is not a production token.
5. **Feature flags** — Wizard, App Health, and Risk UX are gated at build time. Tests **skip** with a clear message when the corresponding UI is absent (`NEXT_PUBLIC_FEATURE_COMPRESSED_WIZARD`, `NEXT_PUBLIC_FEATURE_APP_HEALTH_SCORE`, `NEXT_PUBLIC_FEATURE_RISK_BASED_UX`).
6. **Calibration-driven scores** — On the dealer command view, T6.4 exposes numeric “Ajustes rápidos”. Playwright fills those fields to place the readiness score in predictable bands for health and risk assertions.

## Coverage matrix

| Scenario / area | Desktop (Chrome) | iPhone SE | iPhone 11 Pro Max | iPad Pro |
| --------------- | ---------------- | --------- | ------------------ | -------- |
| Compressed wizard full 5-step flow | Yes (only project) | Skipped | Skipped | Skipped |
| Smart defaults per step | Yes | Skipped | Skipped | Skipped |
| VIN scan / decode simulation | Yes | Skipped | Skipped | Skipped |
| Offline draft persistence / sync | Yes | Skipped | Skipped | Skipped |
| Timing telemetry and <25 min target | Yes | Skipped | Skipped | Skipped |
| Validation on each step | Yes | Skipped | Skipped | Skipped |
| App Health score accuracy / suggestions / visual feedback | Yes | Skipped* | Skipped* | Skipped* |
| Risk-based UX (5 tests) | Yes | Skipped* | Skipped* | Skipped* |
| Mobile layout / touch | Skipped | Primary | Plus layout | Tablet layout |
| Frontend integration mobile 375/414/768 | Jest/jsdom | Jest/jsdom | Jest/jsdom | Jest/jsdom |
| Lighthouse mobile performance budget >90 | Budget asserted in integration; run real audit on preview URL | Manual audit | — | — |

\*Health includes a 375×812 viewport case on **desktop** by resizing the browser.

## How to run

### Prerequisites

```bash
npx playwright install
```

### Local / staging against a running dashboard

Preferred PR preview run:

```bash
set VERCEL_BRANCH_URL=<your-pr-preview-host>.vercel.app
set E2E_EMAIL=your@user.com
set E2E_PASSWORD=***
set E2E_TENANT_SLUG=credicefi
npx playwright test --config=playwright.config.dealer.ts
```

Faster loop (desktop project only — wizard, health, and risk specs are written for `chromium-desktop`; other projects exit quickly via `test.skip`):

```bash
npx playwright test --config=playwright.config.dealer.ts --project=chromium-desktop
```

Fallback staging/local override:

```bash
set E2E_BASE_URL=https://<non-production-preview-host>
npx playwright test --config=playwright.config.dealer.ts
```

For a **local** Next server on port 3000:

```bash
set E2E_BASE_URL=http://127.0.0.1:3000
npx playwright test --config=playwright.config.dealer.ts
```

### Frontend mobile integration

The requested mobile integration lives in `tests/integration/frontend/test_dealer_flow_mobile.tsx`.

```bash
npx jest --testMatch "**/tests/integration/frontend/test_dealer_flow_mobile.tsx"
```

It covers 375 px (iPhone SE), 414 px (iPhone 12), 768 px (iPad), touch-sized navigation, health score mobile rendering, and the Lighthouse performance budget configuration. A real Lighthouse run should still be executed against the PR preview URL before merge:

```bash
npx lighthouse "https://<your-pr-preview-host>.vercel.app/credit/dealer/new" --only-categories=performance --output=json --output-path=lh-dealer-mobile.json
```

Interpret the resulting `categories.performance.score` as a 0-1 value. The Phase A target is `> 0.90`.

### CI considerations

- `forbidOnly: !!process.env.CI` — no `test.only` in CI.
- `retries: 2` and `workers: 1` in CI for stability on shared runners.
- Store secrets (`E2E_PASSWORD`, etc.) in the CI secret store, not in the repo.
- CI should export `VERCEL_BRANCH_URL` or `VERCEL_URL`; production `dashboard.nadakki.com` is not the default and should not be used for PR verification.

## Test data management

| Data | Source |
| ---- | ------ |
| Login | `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_TENANT_SLUG` (defaults in `helpers.ts` for local smoke only) |
| JWT mock | `e2e/fixtures/dealer_jwt.json` |
| Application id for mocks | `MOCK_APP_ID` (`e2e-dealer-mock-app-001`) |
| VIN sample | `SAMPLE_VIN` — valid 17 chars without I/O/Q |
| Calibration | “Credit score proxy”, DTI %, LTV %, etc. on dealer command view |

## Cleanup strategy

- **No persistent data** — All creates/applicant/vehicle/process calls are fulfilled by mocks; nothing hits a real database from these tests when routes are active.
- **Storage** — Wizard tests may write `nadakki:cw-draft:*` and `nadakki:cw-telemetry:*` in `localStorage` / `sessionStorage`. Use a dedicated E2E tenant/user or incognito profiles if running against shared staging.
- **Lighthouse** — The integration test asserts the mobile performance budget and URL safety (preview, not production). The real Lighthouse audit remains a CLI/LHCI step against the Vercel preview URL because this repo does not include Lighthouse as a dependency.

## Interpreting failures

- **Login timeout** — Verify preview env vars and credentials. If `/login` does not redirect to `/credit-hub` or `/dashboard`, the test never reaches the mocked dealer API routes.
- **Feature skipped** — The preview was built without `NEXT_PUBLIC_FEATURE_COMPRESSED_WIZARD` or `NEXT_PUBLIC_FEATURE_APP_HEALTH_SCORE`. Skips are expected for disabled flags, failures are not.
- **Wizard validation failure** — Check the visible step and first `role="alert"`. The tests assert each required gate independently before moving on.
- **Offline draft failure** — Inspect browser storage for `nadakki:cw-draft:*`. These tests rely on localStorage and should run in an isolated browser context.
- **Health score mismatch** — Compare the visible `aria-valuenow` with the weighted model in `lib/credit/app-health-score.ts`: credit 35, DTI 25, LTV 20, employment 10, docs 10.
- **Lighthouse below target** — Treat `0.90` or lower as a Phase A regression candidate. Attach the JSON report to the PR and compare LCP/TBT/CLS deltas before filing a UI bug.

## Related code

| Area | Reference |
| ---- | --------- |
| Wizard UI | `components/credit/CompressedWizard.tsx`, `CompressedWizardSteps.tsx` |
| Wizard hook | `hooks/useCompressedWizard.ts` |
| Health & risk | `components/credit/AppHealthScore.tsx`, `RiskBasedUI.tsx` |
| Dealer detail | `app/credit/dealer/[applicationId]/DealerApplicationClient.tsx` |
