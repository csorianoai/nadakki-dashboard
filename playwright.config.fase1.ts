import { defineConfig, devices } from "@playwright/test";

/**
 * Puerta de la fase 1 de marketing (CI: .github/workflows/ci-fase1-dashboard.yml). Prueba e2e/fase1 contra un
 * `next start` del build de produccion, HERMETICA: el backend siempre esta interceptado.
 *
 * Tres capas, para que ninguna llamada llegue a un backend real aunque un spec se olvide de interceptarla:
 *  1. El backend declarado es `backend.invalid` (no resuelve) para el servidor y para el build.
 *  2. El navegador no resuelve ningun host salvo 127.0.0.1 (--host-resolver-rules): lo que un spec no intercepte con
 *     page.route / context.route falla de inmediato en vez de salir a la red. Lo interceptado no necesita DNS.
 *  3. Esta config se NIEGA a arrancar con PLAYWRIGHT_BASE_URL o BASE_URL: no hay modo de apuntarla a un entorno real.
 */
const EXTERNA = (process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || "").trim();
if (EXTERNA) {
  throw new Error(
    "playwright.config.fase1.ts es hermetica: no admite PLAYWRIGHT_BASE_URL ni BASE_URL (" + EXTERNA + "). " +
      "El backend va siempre interceptado; para un entorno real usa otra config.",
  );
}

const PUERTO = Number(process.env.PLAYWRIGHT_FASE1_PORT || 3310);
const URL_LOCAL = `http://127.0.0.1:${PUERTO}`;
const BACKEND_FALSO = "http://backend.invalid";

export default defineConfig({
  testDir: "./e2e/fase1",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: URL_LOCAL,
    trace: "on-first-retry",
    launchOptions: {
      args: ["--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1"],
      ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PUERTO}`,
    url: `${URL_LOCAL}/login`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: { BACKEND_URL: BACKEND_FALSO, NEXT_PUBLIC_API_URL: BACKEND_FALSO, NEXT_PUBLIC_BACKEND_URL: BACKEND_FALSO },
  },
});
