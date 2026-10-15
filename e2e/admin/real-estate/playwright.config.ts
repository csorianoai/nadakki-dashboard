import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

/** Prueba visual de /admin/real-estate: build de producción con interruptor y DEMO (3102) y otro sin DEMO (3103); backend inválido. */
const PORT = 3102;
const PORT_NODEMO = 3103;
const BACKEND = "http://backend.invalid";

export default defineConfig({
  testDir: "./",
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, viewport: { width: 1440, height: 900 }, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command:
      `npm run build && NEXT_DIST_DIR=.next-nodemo NEXT_PUBLIC_REALTOR_ALLOW_DEMO=0 npm run build && ` +
      `sh -c 'NEXT_DIST_DIR=.next-nodemo npx next start -p ${PORT_NODEMO} & P=$!; trap "kill $P" EXIT TERM INT; npx next start -p ${PORT}'`,
    url: `http://127.0.0.1:${PORT}/login`,
    timeout: 1_800_000,
    cwd: resolve(__dirname, "../../.."),
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_REALTOR_PANEL: "1",
      NEXT_PUBLIC_REALTOR_ALLOW_DEMO: "1",
      BACKEND_URL: BACKEND,
      NEXT_PUBLIC_API_URL: BACKEND,
    },
  },
});
