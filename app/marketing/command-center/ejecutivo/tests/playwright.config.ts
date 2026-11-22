import { defineConfig, devices } from "@playwright/test";
import { join } from "path";

/**
 * Capturas de EVIDENCIA de la pantalla patron (NO son baseline aprobado: el baseline solo lo otorga Cesar con BASELINE_APPROVED).
 * Requiere el harness:  OUT=/tmp/cc-harness bash app/marketing/command-center/ejecutivo/tests/build-harness.sh
 * Sin red, HTML estatico y determinista, animaciones/transiciones desactivadas en el spec, reloj congelado en los datos.
 */
export default defineConfig({
  testDir: join(__dirname, "e2e"),
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  retries: 0,
  fullyParallel: false,
  reporter: "list",
  outputDir: process.env.CC_EVIDENCIA ?? "test-results/command-center-evidencia",
  use: {
    colorScheme: "light",
    contextOptions: { reducedMotion: "reduce" },
    locale: "es-MX",
    timezoneId: "UTC",
    ...(process.env.PW_CHROMIUM ? { launchOptions: { executablePath: process.env.PW_CHROMIUM } } : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
