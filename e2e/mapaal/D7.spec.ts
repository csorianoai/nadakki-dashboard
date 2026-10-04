/**
 * D7 — importador de la PLANTILLA_ACTIVOS_v4 (contrato P5).
 *
 * Corre SOLO contra el tenant QA, con `QA_USER` / `QA_PASSWORD` (y
 * `QA_TENANT_SLUG` si el host no fija el tenant). Nunca con credenciales de
 * usuarios reales de Mapaal. El login de la app no tiene paso MFA, asi que
 * `QA_TOTP_SECRET` no se usa.
 *
 * Fixture: `fixtures/D7_plantilla_v4_qa.xlsx` es la plantilla v4 oficial del
 * backend con UNA fila en Vehiculos (QA-D7-0001, stock inicial, BORRADOR) y
 * UNA en Costos_vehiculos (COMPRA 1.000.000 ARS, es_apertura=SI). Aplicarla
 * escribe en el tenant QA; el vehiculo es idempotente por `stock_number`, asi
 * que al repetir la prueba se ACTUALIZA en vez de duplicarse.
 *
 * Guion (de la pantalla de D7 3/4):
 *   1. El inventario ofrece "Importar planilla" y abre /autos/dealer/inventario/importar.
 *   2. Las reglas contables estan a la vista: 3020 para el saldo inicial, 2010 para compras.
 *   3. Aplicar nace apagado.
 *   4. Revisar manda el .xlsx en multipart y el backend contesta la revision de
 *      la v4: sin errores, 1 vehiculo y 1 costo de apertura (haber 3020).
 *   5. Aplicar sale con Idempotency-Key, el backend lo acepta y la pantalla lo dice.
 *   6. El vehiculo aparece en el inventario.
 *
 * RESULT_D7=PASS se imprime al FINAL del mismo test, despues de las aserciones.
 *
 * Ejecutar: BASE_URL=... QA_USER=... QA_PASSWORD=... \
 *   npx playwright test e2e/mapaal/D7.spec.ts
 */
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL;
const QA_USER = process.env.QA_USER;
const QA_PASSWORD = process.env.QA_PASSWORD;
const QA_TENANT_SLUG = process.env.QA_TENANT_SLUG;

const FIXTURE = path.join(__dirname, "fixtures", "D7_plantilla_v4_qa.xlsx");
const IMPORT = /\/dealers\/[^/]+\/import-activos\/?$/;

test.skip(!BASE_URL || !QA_USER || !QA_PASSWORD, "Faltan BASE_URL, QA_USER o QA_PASSWORD");

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[type="email"]').fill(QA_USER!);
  await page.locator('input[type="password"]').fill(QA_PASSWORD!);
  const tenantInput = page.getByPlaceholder("tu-institucion");
  if (QA_TENANT_SLUG && (await tenantInput.count()) > 0) await tenantInput.fill(QA_TENANT_SLUG);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 60_000 });
}

function esImport(url: string, modo: string, method: string) {
  const u = new URL(url);
  return method === "POST" && IMPORT.test(u.pathname) && u.searchParams.get("modo") === modo;
}

test("D7: inventario -> Importar planilla -> revisar -> aplicar la v4", async ({ page }) => {
  test.setTimeout(180_000);
  await login(page);

  // 1. La entrada desde el inventario.
  await page.goto(`${BASE_URL}/autos/dealer/inventario`);
  const cta = page.getByTestId("inventario-importar");
  await expect(cta).toBeVisible({ timeout: 30_000 });
  await expect(cta).toHaveAttribute("href", "/autos/dealer/inventario/importar");
  await cta.click();
  await page.waitForURL((url) => url.pathname === "/autos/dealer/inventario/importar", { timeout: 30_000 });

  // 2. Las reglas, antes de subir nada.
  const reglas = page.getByTestId("import-reglas");
  await expect(reglas).toContainText("3020");
  await expect(reglas).toContainText("2010");
  await expect(reglas).toContainText("SIN IVA recuperable");

  // 3. La puerta esta abierta y aplicar nace apagado.
  await expect(page.getByTestId("import-formulario")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("import-denegado")).toHaveCount(0);
  await expect(page.getByTestId("import-aplicar")).toBeDisabled();

  // 4. Revision.
  await page.getByTestId("import-archivo").setInputFiles(FIXTURE);
  const revReq = page.waitForRequest((r) => esImport(r.url(), "revision", r.method()));
  const revRes = page.waitForResponse((r) => esImport(r.url(), "revision", r.request().method()));
  await page.getByTestId("import-revisar").click();

  const req = await revReq;
  expect(req.headers()["content-type"] ?? "").toMatch(/^multipart\/form-data; boundary=/);
  expect(req.headers()).not.toHaveProperty("x-tenant-id");
  const res = await revRes;
  expect(res.status(), `revision ${res.url()} -> ${res.status()}`).toBe(200);

  const revision = page.getByTestId("import-revision");
  await expect(revision).toBeVisible({ timeout: 30_000 });
  await expect(revision).toHaveAttribute("data-version", "PLANTILLA_ACTIVOS_v4");
  await expect(page.getByTestId("import-errores")).toHaveCount(0);
  await expect(page.getByTestId("import-hoja-Vehiculos")).toHaveAttribute("data-filas", "1");
  const costos = page.getByTestId("import-hoja-Costos_vehiculos");
  await expect(costos).toHaveAttribute("data-filas", "1");
  // Columnas: Hoja, Filas, Crear, Actualizar, Archivar, Apertura (3020), Compras (2010).
  await expect(costos.locator("td").nth(5)).toHaveText("1");
  await expect(costos.locator("td").nth(6)).toHaveText(/^(0|—)$/);

  // 5. Aplicar.
  const aplicar = page.getByTestId("import-aplicar");
  await expect(aplicar).toBeEnabled();
  const apReq = page.waitForRequest((r) => esImport(r.url(), "aplicar", r.method()));
  const apRes = page.waitForResponse((r) => esImport(r.url(), "aplicar", r.request().method()));
  await aplicar.click();
  expect((await apReq).headers()["idempotency-key"] ?? "").not.toBe("");
  const ap = await apRes;
  expect(ap.status(), `aplicar ${ap.url()} -> ${ap.status()}`).toBe(200);
  await expect(page.getByTestId("import-aplicado")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("import-aplicar-rechazado")).toHaveCount(0);
  await expect(page.getByTestId("import-aplicar-error")).toHaveCount(0);
  const vehiculos = page.getByTestId("import-aplicado-detalle").getByTestId("import-hoja-Vehiculos");
  // Crear la primera vez, actualizar al repetir: nunca dos.
  const [crear, actualizar] = await Promise.all([
    vehiculos.locator("td").nth(2).innerText(),
    vehiculos.locator("td").nth(3).innerText(),
  ]);
  expect(Number(crear) + Number(actualizar)).toBe(1);

  // 6. En el inventario.
  await page.goto(`${BASE_URL}/autos/dealer/inventario`);
  await expect(page.getByText("2020 QA Mapaal D7 Importador").first()).toBeVisible({ timeout: 30_000 });

  console.log(`D7: revision ${res.status()} · aplicar ${ap.status()} · crear=${crear} actualizar=${actualizar}`);
  console.log("RESULT_D7=PASS");
});
