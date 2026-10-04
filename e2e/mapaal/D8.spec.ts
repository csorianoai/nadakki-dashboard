/**
 * D8 — Libro mayor y Balance abren sin cerrar la sesion, y la facturacion
 * electronica de un tenant AR dice "se gestiona en ARCA" (#573, #574).
 *
 * Corre SOLO contra el tenant QA, con `QA_USER` / `QA_PASSWORD` (y
 * `QA_TENANT_SLUG` si el host no fija el tenant). Nunca con credenciales de
 * usuarios reales de Mapaal. El login de la app no tiene paso MFA, asi que
 * `QA_TOTP_SECRET` no se usa. No escribe nada: solo navega y lee.
 *
 * Guion (de #573 y #574; el de moneda vive en #566):
 *   1. Plan de cuentas carga y, arriba, sale el recuadro informativo de ARCA
 *      (`facturacion-arca`), no el ambar de "No se pudo leer el estado". El
 *      409 llega por el proxy con su `detail`, no como "Upstream error 409".
 *   2. Libro mayor y Balance de comprobacion cargan con sus selectores, sin
 *      acabar en /login y sin "No se pudo verificar la sesion".
 *   3. F5 en cada una: la sesion sigue abierta.
 *   4. Plan de cuentas -> Libro mayor -> Balance -> Plan de cuentas: ningun
 *      salto pide login.
 *   5. Servidor lento: el primer refresh de la sesion responde 504. Sale
 *      "No se pudo verificar la sesion"; "Reintentar" recupera la sesion y
 *      carga Libro mayor. Antes de #574, ese 504 borraba los tokens y
 *      "Reintentar" llevaba a /login.
 *   En todas: ninguna aparicion de "Upstream" en pantalla.
 *
 * Pais fiscal del tenant QA: AR por defecto (es la copia de Mapaal). Si el
 * tenant QA fuera de otro pais, `D8_FISCAL_COUNTRY=<pais>` desactiva SOLO la
 * exigencia del recuadro de ARCA; el resto se sigue exigiendo.
 *
 * RESULT_D8=PASS se imprime al FINAL del ultimo test, despues de todas las
 * aserciones: si alguna falla, no se imprime.
 *
 * Ejecutar: BASE_URL=... QA_USER=... QA_PASSWORD=... \
 *   npx playwright test e2e/mapaal/D8.spec.ts
 */
import { expect, test, type Page, type Response } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
const QA_USER = process.env.QA_USER;
const QA_PASSWORD = process.env.QA_PASSWORD;
const QA_TENANT_SLUG = process.env.QA_TENANT_SLUG;
const PAIS_FISCAL = (process.env.D8_FISCAL_COUNTRY ?? "AR").toUpperCase();

const PLAN = "/contable/plan-cuentas";
const LIBRO = "/contable/libro-mayor";
const BALANCE = "/contable/balance-comprobacion";

test.describe.configure({ mode: "serial" });
test.skip(
  !BASE_URL || !QA_USER || !QA_PASSWORD,
  "Faltan BASE_URL, QA_USER o QA_PASSWORD",
);
test.use({ viewport: { width: 1440, height: 900 } });

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[type="email"]').fill(QA_USER!);
  await page.locator('input[type="password"]').fill(QA_PASSWORD!);
  const tenantInput = page.getByPlaceholder("tu-institucion");
  if (QA_TENANT_SLUG && (await tenantInput.count()) > 0)
    await tenantInput.fill(QA_TENANT_SLUG);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 60_000,
  });
}

/** La pantalla contable cargo dentro de la sesion: titulo pintado, sin /login ni error de sesion. */
async function pantallaConSesion(page: Page, ruta: string, titulo: string) {
  await expect(page.getByRole("heading", { name: titulo }).first()).toBeVisible(
    { timeout: 45_000 },
  );
  expect(new URL(page.url()).pathname).toBe(ruta);
  await expect(page.getByText("No se pudo verificar la sesion")).toHaveCount(0);
  await expect(page.getByText("Verificando sesion...")).toHaveCount(0);
  await expect(page.getByText(/Upstream/)).toHaveCount(0);
}

/** Salto por el menu (navegacion de cliente); si el enlace no esta en el menu, por URL. */
async function ir(page: Page, ruta: string) {
  const enlace = page.locator(`a[href="${ruta}"]`).first();
  if ((await enlace.count()) > 0 && (await enlace.isVisible()))
    await enlace.click();
  else await page.goto(`${BASE_URL}${ruta}`);
  await page.waitForURL(
    (url) => url.pathname === ruta || url.pathname.startsWith("/login"),
    { timeout: 45_000 },
  );
}

async function libroMayorCargado(page: Page) {
  await pantallaConSesion(page, LIBRO, "Libro mayor");
  await expect(page.getByLabel("Cuenta", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Periodo", { exact: true })).toBeVisible();
  // Si cuentas/periodos fallan, la pantalla lo dice con Reintentar; no debe hacer falta.
  await expect(page.getByTestId("contable-error-reintentar")).toHaveCount(0);
}

async function balanceCargado(page: Page) {
  await pantallaConSesion(page, BALANCE, "Balance de comprobación");
  await expect(page.getByLabel("Periodo", { exact: true })).toBeVisible();
  await expect(page.getByTestId("contable-error-reintentar")).toHaveCount(0);
}

test("D8.1: Plan de cuentas dice que la facturacion electronica se gestiona en ARCA", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await login(page);

  const fiscal = page.waitForResponse(
    (res: Response) =>
      new URL(res.url()).pathname.startsWith("/api/v1/contable/fiscal/"),
    { timeout: 45_000 },
  );
  await page.goto(`${BASE_URL}${PLAN}`);
  await pantallaConSesion(page, PLAN, "Plan de cuentas");

  const res = await fiscal;
  const cuerpo = await res.text();
  console.log(
    `D8: GET ${new URL(res.url()).pathname} -> ${res.status()} ${cuerpo.slice(0, 200)}`,
  );
  // #573: el proxy reenvia el cuerpo del backend tal cual, sin envolverlo.
  expect(cuerpo).not.toContain("Upstream error");

  if (PAIS_FISCAL === "AR") {
    expect(res.status()).toBe(409);
    expect(
      (JSON.parse(cuerpo) as { detail?: { error?: string } }).detail?.error,
    ).toBe("AR_NOT_CONFIGURED");
    const arca = page.getByTestId("facturacion-arca");
    await expect(arca).toBeVisible({ timeout: 30_000 });
    await expect(arca).toHaveAttribute("role", "note");
    await expect(arca).toContainText(
      "Facturación electrónica: se gestiona en ARCA",
    );
    await expect(page.getByTestId("facturacion-problema")).toHaveCount(0);
  }
});

test("D8.2: Libro mayor y Balance abren, aguantan F5 y la navegacion, sin /login", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await login(page);

  await page.goto(`${BASE_URL}${PLAN}`);
  await pantallaConSesion(page, PLAN, "Plan de cuentas");

  await page.goto(`${BASE_URL}${LIBRO}`);
  await libroMayorCargado(page);
  if (PAIS_FISCAL === "AR")
    await expect(page.getByTestId("facturacion-arca")).toBeVisible({
      timeout: 30_000,
    });
  await page.reload();
  await libroMayorCargado(page);

  await page.goto(`${BASE_URL}${BALANCE}`);
  await balanceCargado(page);
  if (PAIS_FISCAL === "AR")
    await expect(page.getByTestId("facturacion-arca")).toBeVisible({
      timeout: 30_000,
    });
  await page.reload();
  await balanceCargado(page);

  // Ida y vuelta por el menu, sin recargar: ningun salto pide login.
  for (let vuelta = 0; vuelta < 2; vuelta++) {
    await ir(page, PLAN);
    await pantallaConSesion(page, PLAN, "Plan de cuentas");
    await ir(page, LIBRO);
    await libroMayorCargado(page);
    await ir(page, BALANCE);
    await balanceCargado(page);
  }
});

test("D8.3: un refresh que falla con 504 no cierra la sesion y Reintentar la recupera", async ({
  page,
}) => {
  test.setTimeout(150_000);
  await login(page);
  await page.goto(`${BASE_URL}${PLAN}`);
  await pantallaConSesion(page, PLAN, "Plan de cuentas");

  // Solo el PRIMER refresh tras la recarga falla, como un backend frio.
  let fallados = 0;
  await page.route("**/api/v2/auth/refresh**", async (route) => {
    if (fallados === 0) {
      fallados++;
      await route.fulfill({
        status: 504,
        contentType: "application/json",
        body: JSON.stringify({ detail: "gateway_timeout" }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`${BASE_URL}${LIBRO}`);
  const aviso = page.getByText("No se pudo verificar la sesion");
  await expect(aviso).toBeVisible({ timeout: 30_000 });
  expect(fallados).toBe(1);
  expect(new URL(page.url()).pathname).toBe(LIBRO);

  await page.getByRole("button", { name: "Reintentar" }).click();
  await libroMayorCargado(page);
  await expect(aviso).toHaveCount(0);
  expect(new URL(page.url()).pathname).not.toMatch(/^\/login/);

  console.log("RESULT_D8=PASS");
});
