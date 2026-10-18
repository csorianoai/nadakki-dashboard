import { defineConfig, devices } from "@playwright/test";

/**
 * PI-D1 hermético: el dashboard se construye y arranca en un puerto local, sin backend (backend.invalid) y sin
 * credenciales ni variables de entorno de despliegue.
 */
const PORT = Number(process.env.PI_D1_PORT ?? 3917);
const BASE = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: ".",
  testMatch: "signals.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  retries: 0,
  use: { baseURL: BASE, trace: "on-first-retry", screenshot: "only-on-failure", serviceWorkers: "block" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT} -H 127.0.0.1`,
    url: `${BASE}/login`,
    timeout: 900_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_RENDER_API_URL: "http://backend.invalid",
      NEXT_PUBLIC_BACKEND_URL: "http://backend.invalid",
      NEXT_PUBLIC_REALTOR_PANEL: "1",
    },
  },
});
