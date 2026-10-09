import { defineConfig, devices } from "@playwright/test";
import { TIMEOUT_TEST_MS } from "./login";

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error("BASE_URL es obligatorio para e2e/bank-v2 (sin valor por defecto).");
}

export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: TIMEOUT_TEST_MS,
  expect: { timeout: 30_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
