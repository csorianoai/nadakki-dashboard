import { defineConfig, devices } from "@playwright/test";

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
    baseURL: process.env.E2E_BASE_URL ?? "https://dashboard.nadakki.com",
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
