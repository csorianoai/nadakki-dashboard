/**
 * D4 — costos del vehiculo y factura de reparacion (cadena #559/#572).
 *
 * Corre SOLO contra el tenant QA, con `QA_USER` / `QA_PASSWORD`. Nunca con
 * credenciales de usuarios reales de Mapaal. El login va por `iniciarSesionQA`
 * (como D3/D5/D8). El login de la app no tiene paso MFA: `QA_TOTP_SECRET` no
 * se usa. Registra UN costo de traslado de 1.00 en una unidad del tenant QA.
 *
 * Guion (de #572 y #559):
 *   1. /autos/dealer/finanzas deja elegir una unidad y pinta "Costo total acumulado".
 *   2. Las cinco reglas contables de carga se leen junto al monto (sin IVA
 *      recuperable; comision = solo de compra).
 *   3. La ayuda cambia con el tipo elegido y cada tipo muestra la suya.
 *   4. Reparacion exige proveedor, n.o de factura y document_id: sin ellos no
 *      sale ninguna peticion a /repair-invoices.
 *   5. Un costo no-reparacion viaja por POST .../costs con campos del contrato,
 *      el backend responde 2xx y la pantalla confirma el alta.
 *
 * RESULT_D4=PASS se imprime al FINAL del mismo test, despues de las aserciones.
 *
 * Ejecutar: BASE_URL=... QA_USER=... QA_PASSWORD=... \
 *   npx playwright test e2e/mapaal/D4.spec.ts
 */
import { expect, test } from "@playwright/test";

import { iniciarSesionQA } from "./sesion-qa";

const BASE_URL = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/+$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";

const COSTO = /\/vehicles\/[^/]+\/costs\/?(\?.*)?$/;
const REPARACION = /\/vehicles\/[^/]+\/repair-invoices\/?(\?.*)?$/;

test.skip(!BASE_URL || !QA_USER || !QA_PASSWORD, "Faltan BASE_URL, QA_USER o QA_PASSWORD");

test("D4: finanzas -> reglas contables, reparacion exige factura, costo sale por /costs", async ({ browser }) => {
  test.setTimeout(180_000);
  const page = await iniciarSesionQA(browser, { baseUrl: BASE_URL, usuario: QA_USER, clave: QA_PASSWORD });

  const hechas: string[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST") hechas.push(new URL(req.url()).pathname);
  });

  // 1. La pantalla y una unidad del inventario QA.
  await page.goto(`${BASE_URL}/autos/dealer/finanzas`);
  await expect(page.getByTestId("finanzas-bloqueado")).toHaveCount(0);
  await expect(page.getByTestId("finanzas-sin-contexto")).toHaveCount(0);
  const selector = page.getByTestId("finanzas-vehiculo");
  await expect(selector).toBeVisible({ timeout: 30_000 });
  const unidades = selector.locator("option:not([value=''])");
  expect(await unidades.count(), "el tenant QA no tiene ninguna unidad para costear").toBeGreaterThan(0);
  await selector.selectOption(await unidades.first().getAttribute("value") as string);
  await expect(page.getByTestId("costos-total")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("costo-alta-form")).toBeVisible();

  // 2. Las cinco reglas, donde se carga el monto.
  const reglas = page.getByTestId("reglas-contables-costos");
  await expect(reglas).toBeVisible();
  await expect(reglas.locator("li")).toHaveCount(5);
  await expect(reglas).toContainText("SIN IVA recuperable");
  await expect(reglas).toContainText("El IVA recuperable no forma parte del costo del vehículo.");
  await expect(reglas).toContainText("exclusivamente comisión de compra");
  await expect(reglas).toContainText("RT 54 FACPCE");

  // 3. La ayuda sigue al tipo elegido; cada tipo muestra la suya.
  const tipo = page.locator('select[name="cost_type"]');
  const ayuda = page.getByTestId("ayuda-tipo-de-costo");
  const codigos = await tipo.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  expect(codigos).toEqual(expect.arrayContaining(["repair", "transport", "tax", "commission"]));
  const vistas = new Set<string>();
  for (const codigo of codigos) {
    await tipo.selectOption(codigo);
    if ((await ayuda.count()) === 0) continue; // un tipo sin ayuda no pinta relleno
    await expect(ayuda).toHaveAttribute("data-cost-type", codigo);
    const texto = ((await ayuda.textContent()) ?? "").trim();
    expect(texto.length).toBeGreaterThan(0);
    expect(vistas.has(texto), `el tipo ${codigo} repite la ayuda de otro`).toBe(false);
    vistas.add(texto);
  }
  await tipo.selectOption("commission");
  await expect(ayuda).toContainText("Comisión de compra");

  // 4. Reparacion: tres campos obligatorios y nada sale sin ellos.
  await tipo.selectOption("repair");
  const bloque = page.getByTestId("costo-reparacion");
  await expect(bloque).toBeVisible();
  for (const nombre of ["supplier_name", "invoice_number", "document_id"]) {
    await expect(bloque.locator(`input[name="${nombre}"]`)).toBeVisible();
  }
  await page.locator('input[name="amount"]').fill("1.00");
  await page.locator('input[name="incurred_at"]').fill("2026-01-15");
  await page.getByRole("button", { name: "Registrar costo" }).click();
  await expect(bloque.getByRole("alert").first()).toBeVisible();
  await expect(page.getByTestId("costo-alta-ack")).toHaveCount(0);
  expect(hechas.filter((p) => REPARACION.test(p)), "reparacion sin factura no debe salir").toHaveLength(0);

  // 5. Un costo de traslado: POST /costs, 2xx, confirmacion.
  await tipo.selectOption("transport");
  await expect(bloque).toHaveCount(0);
  await page.locator('input[name="amount"]').fill("1.00");
  await page.locator('input[name="incurred_at"]').fill("2026-01-15");
  const peticion = page.waitForRequest((req) => req.method() === "POST" && COSTO.test(new URL(req.url()).pathname));
  const respuesta = page.waitForResponse(
    (res) => res.request().method() === "POST" && COSTO.test(new URL(res.url()).pathname),
  );
  await page.getByRole("button", { name: "Registrar costo" }).click();

  const body = (await peticion).postDataJSON() as Record<string, unknown>;
  expect(body).toMatchObject({ cost_type: "transport" });
  expect(Number(body.amount)).toBe(1);
  expect(body).not.toHaveProperty("supplier_name");
  expect(body).not.toHaveProperty("document_id");

  const res = await respuesta;
  expect(res.status(), `POST ${res.url()} -> ${res.status()}`).toBeGreaterThanOrEqual(200);
  expect(res.status()).toBeLessThan(300);
  await expect(page.getByTestId("costo-alta-error")).toHaveCount(0);
  await expect(page.getByTestId("costo-alta-ack")).toHaveText("Costo registrado.", { timeout: 30_000 });
  await expect(page.getByTestId("costos-total-valor")).toBeVisible({ timeout: 30_000 });

  console.log(`D4: POST ${res.status()} ${new URL(res.url()).pathname}`);
  console.log("RESULT_D4=PASS");
});
