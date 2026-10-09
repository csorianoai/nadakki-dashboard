import type { Page } from "@playwright/test";

function requerida(nombre: string): string {
  const v = process.env[nombre];
  if (!v) throw new Error(`Falta la variable de entorno ${nombre}`);
  return v;
}

/** Inicia sesión por la UI con QA_USER, QA_PASSWORD y QA_TENANT_SLUG. */
export async function login(page: Page): Promise<void> {
  const user = requerida("QA_USER");
  const password = requerida("QA_PASSWORD");
  const tenant = requerida("QA_TENANT_SLUG");

  await page.goto("/login");
  await page.locator('input[type="email"]').fill(user);
  await page.locator('input[type="password"]').fill(password);
  // En subdominios de concesionario el campo de tenant no existe (el tenant lo fija el host).
  const campoTenant = page.getByPlaceholder("tu-institucion", { exact: true });
  if (await campoTenant.count()) await campoTenant.fill(tenant);
  await page.getByRole("button", { name: /iniciar sesi/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}
