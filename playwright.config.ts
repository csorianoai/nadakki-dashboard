import { defineConfig, devices } from "@playwright/test";

/**
 * E2E expects a running Next app so same-origin `/api/v2/credit/*` rewrites apply.
 * Example: `npm run dev` (port 3000) in another terminal, then `npm run test:e2e`.
 * Override: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3005 npm run test:e2e`
 *
 * En CI, sin URL externa (ni PLAYWRIGHT_BASE_URL ni BASE_URL), la evidencia levanta el servidor LOCAL ya construido,
 * hermetico: el backend declarado es `backend.invalid` (no resuelve), asi que ninguna llamada llega a un backend real.
 * Los specs que lo usan interceptan esas llamadas con datos fijos (page.route / context.route).
 */
const EXTERNA = (process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || "").trim();
const LOCAL_CI = !!process.env.CI && !EXTERNA;
const PUERTO_LOCAL = Number(process.env.PLAYWRIGHT_LOCAL_PORT ?? 3109);
const URL_LOCAL = `http://127.0.0.1:${PUERTO_LOCAL}`;
const BACKEND_FALSO = "http://backend.invalid";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: EXTERNA || (LOCAL_CI ? URL_LOCAL : "http://127.0.0.1:3000"),
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: LOCAL_CI
    ? {
        command: `npx next dev --webpack -p ${PUERTO_LOCAL}`,
        url: `${URL_LOCAL}/login`,
        timeout: 300_000,
        reuseExistingServer: false,
        env: { BACKEND_URL: BACKEND_FALSO, NEXT_PUBLIC_API_URL: BACKEND_FALSO },
      }
    : undefined,
});
