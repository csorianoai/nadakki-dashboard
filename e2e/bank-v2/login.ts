import type { Page } from "@playwright/test";

/** Esperas máximas del login; el timeout del test debe cubrirlas con holgura (ver tests/e2e/bank-v2-login.test.ts). */
export const ESPERA_FORMULARIO_MS = 60_000;
export const ESPERA_SALIDA_LOGIN_MS = 90_000;
export const TIMEOUT_TEST_MS = 300_000;

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
  await email.waitFor({ state: "visible", timeout: ESPERA_FORMULARIO_MS });
  await email.fill(user);
  await page.locator('input[type="password"]').fill(password);
  // En subdominios de concesionario el campo de tenant no existe (el tenant lo fija el host).
  const campoTenant = page.getByPlaceholder("tu-institucion", { exact: true });
  if (await campoTenant.count()) await campoTenant.fill(tenant);
  // Traza de red del login: si no termina, el motivo real (HTTP, petición colgada) va en el error.
  const trazas: string[] = [];
  page.on("response", (r) => {
    if (/\/auth\//.test(r.url())) trazas.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
  page.on("requestfailed", (r) => {
    if (/\/auth\//.test(r.url())) trazas.push(`FALLO ${r.method()} ${r.url()} ${r.failure()?.errorText ?? ""}`);
  });
  await page.getByRole("button", { name: /iniciar sesi/i }).click();

  // Sondeo (como D9) en vez de waitForURL: la salida de /login es una navegación de cliente
  // (router.push) y el sondeo no depende de eventos de navegación. Si el login es rechazado
  // o se queda colgado, el error dice por qué.
  const aviso = page.locator("form div.bg-red-50").first();
  const limite = Date.now() + ESPERA_SALIDA_LOGIN_MS;
  for (;;) {
    if (!new URL(page.url()).pathname.startsWith("/login")) break;
    if (await aviso.isVisible()) {
      throw new Error(`Login rechazado por la UI: ${(await aviso.innerText()).trim()}`);
    }
    if (Date.now() > limite) {
      const boton = (await page.getByRole("button", { name: /iniciar sesi|iniciando/i }).first().innerText()).trim();
      throw new Error(
        `Login sin terminar a los 90 s: url=${page.url()} boton="${boton}" red=[${trazas.join(" | ") || "sin peticiones /auth/"}]`,
      );
    }
    await page.waitForTimeout(500);
  }
  // Deja que la sesión termine de asentarse antes de navegar al panel.
  await page.waitForLoadState("load");
}
