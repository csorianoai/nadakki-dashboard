import { defineConfig, devices } from "@playwright/test";

/**
 * Capturas de EVIDENCIA del kit de analitica (no son baseline aprobado).
 * Requiere haber generado el harness: OUT=/tmp/kit-harness bash e2e/analytics/build-harness.sh
 * Sin red, sin reloj (el HTML es estatico y determinista), animaciones y transiciones desactivadas en el spec.
 */
export default defineConfig({
  testDir: "./e2e/analytics",
  testMatch: /.*\.spec\.ts/,
  timeout: 30_000,
  retries: 0,
  fullyParallel: false,
  reporter: "list",
  outputDir: process.env.ANALYTICS_EVIDENCIA ?? "test-results/analytics-evidencia",
  use: {
    colorScheme: "light",
    contextOptions: { reducedMotion: "reduce" },
    locale: "es-MX",
    timezoneId: "UTC",
    ...(process.env.PW_CHROMIUM ? { launchOptions: { executablePath: process.env.PW_CHROMIUM } } : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
