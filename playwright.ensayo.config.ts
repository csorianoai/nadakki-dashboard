import { defineConfig } from "@playwright/test";

// Ensayo general contra PRODUCCION. Sin webServer: apunta al dominio real del tenant QA.
export default defineConfig({
  testDir: "./e2e/ensayo-qa-autos",
  timeout: 180_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.QA_AUTOS_BASE_URL || "https://qa-autos.nadakki.com",
    trace: "off",
  },
});
