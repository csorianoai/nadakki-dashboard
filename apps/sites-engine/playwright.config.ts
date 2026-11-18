import { defineConfig } from '@playwright/test';

// Envoltorio de la evidencia del loop: solo ejecuta e2e/ci-gate.spec.ts (sin navegador ni servidor).
export default defineConfig({
  testDir: './e2e',
  testMatch: /ci-gate\.spec\.ts$/,
  timeout: 600_000,
  workers: 1,
  reporter: [['list']],
});
