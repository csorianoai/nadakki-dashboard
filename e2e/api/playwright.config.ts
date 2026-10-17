import { defineConfig, devices } from "@playwright/test";

/** Evidencia de API/BFF contra un despliegue (BASE_URL), sin levantar servidor local. */
export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
