# Dealer integration tests

This folder complements **`e2e/dealer/`** Playwright specs.

- **Playwright E2E** covers full browser flows, API interception, and responsive projects (`playwright.config.dealer.ts`).
- **Unit / component tests** for the same domains live under `tests/credit/` and `tests/dealer/` (for example `useCompressedWizard`).

Add Jest integration tests here when you need to assert pure TypeScript glue (mock payload shapes, environment wiring) without a browser. Prefer colocating new cases with the feature they protect and link to `docs/testing/dealer_e2e_plan.md` for the overall strategy.
