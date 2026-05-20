# Dealer flow — Playwright E2E plan (Phase A)

This document covers the **dealer zone** end-to-end tests (`e2e/dealer/`, `playwright.config.dealer.ts`): compressed credit wizard, App Health (T6.4), risk-based UX (T6.5), and responsive / touch checks.

## Strategy

1. **Realistic navigation** — Tests sign in through `/login` (email, password, tenant slug), then exercise `/credit/dealer/new` and `/credit/dealer/[applicationId]`.
2. **Deterministic API** — `e2e/dealer/helpers.ts` stubs `/api/v2/credit/**` from the browser so wizard submit and dealer command views work without a live Credit Core instance. Paths match any host (requests follow `NEXT_PUBLIC_API_URL`).
3. **Feature flags** — Wizard, App Health, and Risk UX are gated at build time. Tests **skip** with a clear message when the corresponding UI is absent (`NEXT_PUBLIC_FEATURE_COMPRESSED_WIZARD`, `NEXT_PUBLIC_FEATURE_APP_HEALTH_SCORE`, `NEXT_PUBLIC_FEATURE_RISK_BASED_UX`).
4. **Calibration-driven scores** — On the dealer command view, T6.4 exposes numeric “Ajustes rápidos”. Playwright fills those fields to place the readiness score in predictable bands for health and risk assertions.

## Coverage matrix

| Scenario / area | Desktop (Chrome) | iPhone SE | iPhone 11 Pro Max | iPad Pro |
| --------------- | ---------------- | --------- | ------------------ | -------- |
| Compressed wizard (12 tests) | Yes (only project) | Skipped | Skipped | Skipped |
| App Health (6 tests) | Yes | Skipped* | Skipped* | Skipped* |
| Risk-based UX (5 tests) | Yes | Skipped* | Skipped* | Skipped* |
| Mobile layout / touch | Skipped | Primary | Plus layout | Tablet layout |
| Lighthouse mobile | All projects skipped (see below) | Manual | — | — |

\*Health includes a 375×812 viewport case on **desktop** by resizing the browser.

## How to run

### Prerequisites

```bash
npx playwright install
```

### Local / staging against a running dashboard

Point at your environment (HTTPS or local):

```bash
set E2E_BASE_URL=https://dashboard.nadakki.com
set E2E_EMAIL=your@user.com
set E2E_PASSWORD=***
set E2E_TENANT_SLUG=credicefi
npx playwright test --config=playwright.config.dealer.ts
```

Faster loop (desktop project only — wizard, health, and risk specs are written for `chromium-desktop`; other projects exit quickly via `test.skip`):

```bash
npx playwright test --config=playwright.config.dealer.ts --project=chromium-desktop
```

Default `E2E_BASE_URL` in `playwright.config.dealer.ts` is `https://dashboard.nadakki.com` if unset.

For a **local** Next server on port 3000:

```bash
set E2E_BASE_URL=http://127.0.0.1:3000
npx playwright test --config=playwright.config.dealer.ts
```

### CI considerations

- `forbidOnly: !!process.env.CI` — no `test.only` in CI.
- `retries: 2` and `workers: 1` in CI for stability on shared runners.
- Store secrets (`E2E_PASSWORD`, etc.) in the CI secret store, not in the repo.

## Test data management

| Data | Source |
| ---- | ------ |
| Login | `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_TENANT_SLUG` (defaults in `helpers.ts` for local smoke only) |
| Application id for mocks | `MOCK_APP_ID` (`e2e-dealer-mock-app-001`) |
| VIN sample | `SAMPLE_VIN` — valid 17 chars without I/O/Q |
| Calibration | “Credit score proxy”, DTI %, LTV %, etc. on dealer command view |

## Cleanup strategy

- **No persistent data** — All creates/applicant/vehicle/process calls are fulfilled by mocks; nothing hits a real database from these tests when routes are active.
- **Storage** — Wizard tests may write `nadakki:cw-draft:*` and `nadakki:cw-telemetry:*` in `localStorage` / `sessionStorage`. Use a dedicated E2E tenant/user or incognito profiles if running against shared staging.
- **Lighthouse** — Not automated in-repo. For a mobile performance gate, run Lighthouse CLI or LHCI against `E2E_BASE_URL` and track thresholds in your release process. The Playwright test is intentionally skipped until a runner is wired (`RUN_LIGHTHOUSE_E2E` / LHCI can be adopted later).

## Related code

| Area | Reference |
| ---- | --------- |
| Wizard UI | `components/credit/CompressedWizard.tsx`, `CompressedWizardSteps.tsx` |
| Wizard hook | `hooks/useCompressedWizard.ts` |
| Health & risk | `components/credit/AppHealthScore.tsx`, `RiskBasedUI.tsx` |
| Dealer detail | `app/credit/dealer/[applicationId]/DealerApplicationClient.tsx` |
