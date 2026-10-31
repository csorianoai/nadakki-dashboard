import { defineConfig, devices } from "@playwright/test";

/**
 * E2E expects a running Next app so same-origin `/api/v2/credit/*` rewrites apply.
 * Example: `npm run dev` (port 3000) in another terminal, then `npm run test:e2e`.
 * Override: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3005 npm run test:e2e`
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
