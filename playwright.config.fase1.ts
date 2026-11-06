import path from "path";

import { defineConfig, devices } from "@playwright/test";

/**
 * Puerta de la fase 1 de marketing (CI: .github/workflows/ci-fase1-dashboard.yml). Prueba e2e/fase1 contra un
 * `next start` del build de produccion, HERMETICA: el backend siempre esta interceptado y NADA de lo que corre en el job
 * puede salir de 127.0.0.1.
 *
 * Capas, porque cada una cubre un proceso distinto:
 *  1. NAVEGADOR (Chromium): backend declarado `backend.invalid`; --no-proxy-server (con un proxy en el entorno el que
 *     resuelve es el proxy) y --host-resolver-rules (solo 127.0.0.1). Lo no interceptado con page.route / context.route falla.
 *  2. NODE (el fixture `request` de Playwright corre en Node y NO pasa por los argumentos de Chromium, ni lo interceptan
 *     page.route ni context.route) y NEXT START (fetch del lado servidor, p. ej. el proxy app/api/v2/[[...path]]):
 *     e2e/fase1/_solo-loopback.cjs, un guard en proceso que solo deja conectar a 127.0.0.1, ::1 y localhost. Se instala
 *     aqui (main y workers cargan esta config) y se hereda por NODE_OPTIONS (next start y cualquier hijo de Node).
 *  3. Sin proxies (HTTP_PROXY, HTTPS_PROXY, ALL_PROXY) en el entorno de Playwright ni de next start.
 *  4. Esta config se NIEGA a arrancar si EXISTE PLAYWRIGHT_BASE_URL o BASE_URL, aunque este vacia.
 */
// Se mira si la variable EXISTE, no su valor: una vacia tambien es un intento de configurar una URL externa.
const URLS_EXTERNAS = ["PLAYWRIGHT_BASE_URL", "BASE_URL"].filter((k) => k in process.env);
if (URLS_EXTERNAS.length) {
  throw new Error(
    "playwright.config.fase1.ts es hermetica: no admite " + URLS_EXTERNAS.join(" ni ") + " (aunque este vacia). " +
      "El backend va siempre interceptado; para un entorno real usa otra config.",
  );
}

// Sin proxies: ni Playwright (main y workers) ni next start los heredan.
for (const k of Object.keys(process.env)) {
  if (["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY"].includes(k.toUpperCase())) delete process.env[k];
}

// Guard de red de Node: en este proceso (main y cada worker cargan esta config) y, por NODE_OPTIONS, en sus hijos.
const GUARD = path.resolve(__dirname, "e2e/fase1/_solo-loopback.cjs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
require(GUARD);
const REQUIRE_GUARD = `--require=${GUARD}`;
const actual = process.env.NODE_OPTIONS || "";
const NODE_OPTIONS = actual.includes(REQUIRE_GUARD) ? actual : `${REQUIRE_GUARD} ${actual}`.trim();
process.env.NODE_OPTIONS = NODE_OPTIONS;

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
      args: ["--no-proxy-server", "--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1"],
      ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PUERTO}`,
    url: `${URL_LOCAL}/login`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      BACKEND_URL: BACKEND_FALSO,
      NEXT_PUBLIC_API_URL: BACKEND_FALSO,
      NEXT_PUBLIC_BACKEND_URL: BACKEND_FALSO,
      NODE_OPTIONS,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
