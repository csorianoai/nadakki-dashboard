import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * Evidencia E2E de Mi web (ST4-08): build de produccion con el panel y DEMO encendidos (3120) y otro build SIN DEMO
 * con NEXT_DIST_DIR aparte (3121); el interruptor se inlinea al compilar. Backend inexistente: todo /api/** se intercepta.
 */
const PORT = 3120;
const PORT_NODEMO = 3121;
const BACKEND = "http://backend.invalid";

export default defineConfig({
  testDir: "./",
  testMatch: /.*\.spec\.ts/,
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, viewport: { width: 1280, height: 900 }, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } }],
  webServer: {
    command:
      `NEXT_PUBLIC_SITES_ALLOW_DEMO=1 npm run build && ` +
      `NEXT_DIST_DIR=.next-sites-nodemo NEXT_PUBLIC_SITES_ALLOW_DEMO=0 npm run build && ` +
      `sh -c 'NEXT_DIST_DIR=.next-sites-nodemo npx next start -p ${PORT_NODEMO} & P=$!; trap "kill $P" EXIT TERM INT; npx next start -p ${PORT}'`,
    url: `http://127.0.0.1:${PORT}/login`,
    timeout: 1_800_000,
    cwd: resolve(__dirname, "../.."),
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_SITES_PANEL: "1",
      NEXT_PUBLIC_SITES_ALLOW_DEMO: "1",
      BACKEND_URL: BACKEND,
      NEXT_PUBLIC_API_URL: BACKEND,
    },
  },
});
