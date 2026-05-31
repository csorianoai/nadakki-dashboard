import { defineConfig, devices } from "@playwright/test";

function dealerBaseURL(): string {
  const url =
    process.env.VERCEL_BRANCH_URL != null
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : process.env.VERCEL_URL != null
        ? `https://${process.env.VERCEL_URL}`
        : process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

  if (/^https:\/\/dashboard\.nadakki\.com\/?$/i.test(url)) {
    throw new Error("Dealer E2E must use a Vercel preview URL or local URL, not production.");
  }

  return url;
}

export default defineConfig({
  testDir: "./e2e/dealer",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report/dealer" }],
    ["json", { outputFile: "test-results/dealer.json" }],
  ],

  use: {
    baseURL: dealerBaseURL(),
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-iphone-se", use: { ...devices["iPhone SE"] } },
    { name: "mobile-iphone-plus", use: { ...devices["iPhone 11 Pro Max"] } },
    { name: "tablet-ipad", use: { ...devices["iPad Pro"] } },
  ],
});
