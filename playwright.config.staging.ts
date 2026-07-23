import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.STAGING_E2E_FRONTEND_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://autos.nadakki.com";

export default defineConfig({
  testDir: "./e2e/staging",
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-staging" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
