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
  // El formulario solo se pinta cuando termina "Verificando sesión…"; esperarlo evita rellenar antes de hidratar.
  const email = page.locator('input[type="email"]');
  await email.waitFor({ state: "visible", timeout: 60_000 });
  await email.fill(user);
  await page.locator('input[type="password"]').fill(password);
  // En subdominios de concesionario el campo de tenant no existe (el tenant lo fija el host).
  const campoTenant = page.getByPlaceholder("tu-institucion", { exact: true });
  if (await campoTenant.count()) await campoTenant.fill(tenant);
  await page.getByRole("button", { name: /iniciar sesi/i }).click();

  // Carrera entre salir de /login y el aviso de error de la propia página: si el login es
  // rechazado, fallar con el motivo real en vez de un timeout opaco de 60 s.
  const salio = page
    .waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000, waitUntil: "commit" })
    .then(() => null);
  const aviso = page
    .locator("form div.bg-red-50")
    .first()
    .waitFor({ state: "visible", timeout: 60_000 })
    .then(async () => (await page.locator("form div.bg-red-50").first().innerText()).trim())
    .catch(() => new Promise<string>(() => {})); // sin aviso: que decida la otra rama
  salio.catch(() => {}); // evita rechazo no atendido si gana el aviso
  const motivo = await Promise.race([salio, aviso]);
  if (motivo) throw new Error(`Login rechazado por la UI: ${motivo}`);
  // Deja que la sesión termine de asentarse antes de navegar al panel.
  await page.waitForLoadState("load");
}
