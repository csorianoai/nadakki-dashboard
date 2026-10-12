import { defineConfig, devices } from "@playwright/test";

/** Pantallas principales contra un `next start` del build de producción (CI: job «visual»). */
export default defineConfig({
  testDir: "./e2e/visual",
  timeout: 60_000,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    colorScheme: "dark",
    ...(process.env.PW_CHROMIUM ? { launchOptions: { executablePath: process.env.PW_CHROMIUM } } : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
