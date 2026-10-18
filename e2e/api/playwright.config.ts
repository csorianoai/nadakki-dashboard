import { defineConfig, devices } from "@playwright/test";

/**
 * Evidencia hermética de PI-P0-2 (nivel ci): arranca el dashboard ya construido (`next build`) con un backend
 * inexistente. Ninguna petición puede salir del origen local ni llegar a un backend real.
 */
const PUERTO = Number(process.env.BFF_JWT_PORT ?? 3107);
const BASE_URL = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: { baseURL: BASE_URL },
  webServer: {
    command: `npx next start -p ${PUERTO}`,
    cwd: process.cwd(),
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_RENDER_API_URL: "http://backend.invalid",
      NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED: "true",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
