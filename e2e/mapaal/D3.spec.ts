/**
 * D3 — alta manual de vehiculo desde el inventario, sin price_rd/price_usd.
 *
 * Corre SOLO contra el tenant QA, con `QA_USER` / `QA_PASSWORD`. Nunca con
 * credenciales de usuarios reales de Mapaal. El login va por `iniciarSesionQA`
 * (como D5/D8): si BASE_URL es mapaal.nadakki.com entra por el host universal
 * con el tenant QA y aborta si la sesion no es de ese tenant. El login de la app
 * no tiene paso MFA, asi que `QA_TOTP_SECRET` no se usa. Crea UN vehiculo en
 * BORRADOR en el tenant QA.
 *
 * Guion (del PR #534):
 *   1. /autos/dealer/inventario ofrece "Nuevo vehiculo" (clave de alta concedida).
 *   2. El enlace abre /autos/dealer/inventario/nuevo con el formulario, no un
 *      "Alta bloqueada" (el caso del dealer sin unidad organizativa).
 *   3. Nace en BORRADOR.
 *   4. El POST a .../dealers/<id>/vehicles lleva solo campos del contrato: ni
 *      price_rd, ni price_usd, ni status.
 *   5. El backend responde 2xx y la pantalla navega a la ficha o confirma el alta.
 *
 * RESULT_D3=PASS se imprime al FINAL del mismo test, despues de las aserciones:
 * si alguna falla, no se imprime.
 *
 * Ejecutar: BASE_URL=... QA_USER=... QA_PASSWORD=... \
 *   npx playwright test e2e/mapaal/D3.spec.ts
 */
import { expect, test } from "@playwright/test";

import { iniciarSesionQA } from "./sesion-qa";

const BASE_URL = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/+$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";

const ALTA = /\/dealers\/[^/]+\/vehicles\/?(\?.*)?$/;

test.skip(!BASE_URL || !QA_USER || !QA_PASSWORD, "Faltan BASE_URL, QA_USER o QA_PASSWORD");

test("D3: inventario -> Nuevo vehiculo -> POST sin price_rd/price_usd", async ({ browser }) => {
  test.setTimeout(180_000);
  const page = await iniciarSesionQA(browser, { baseUrl: BASE_URL, usuario: QA_USER, clave: QA_PASSWORD });

  // 1. La entrada desde la lista.
  await page.goto(`${BASE_URL}/autos/dealer/inventario`);
  const cta = page.getByTestId("inventario-nuevo");
  await expect(cta).toBeVisible({ timeout: 30_000 });
  await expect(cta).toHaveAttribute("href", "/autos/dealer/inventario/nuevo");
  await cta.click();
  await page.waitForURL((url) => url.pathname === "/autos/dealer/inventario/nuevo", { timeout: 30_000 });

  // 2. La puerta esta abierta: formulario, no bloqueo.
  const form = page.getByTestId("vehicle-manual-form");
  await expect(form).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("nuevo-sin-contexto")).toHaveCount(0);
  await expect(page.getByTestId("nuevo-bloqueado")).toHaveCount(0);

  // 3. Nace en BORRADOR.
  await expect(page.getByTestId("vehicle-status")).toHaveText("BORRADOR");

  // 4. El cuerpo que sale por la red.
  const modelo = `D3 QA ${Date.now()}`;
  await form.locator('input[name="make"]').fill("QA Mapaal");
  await form.locator('input[name="model"]').fill(modelo);
  await form.locator('input[name="year"]').fill("2021");

  const peticion = page.waitForRequest((req) => req.method() === "POST" && ALTA.test(new URL(req.url()).pathname));
  const respuesta = page.waitForResponse(
    (res) => res.request().method() === "POST" && ALTA.test(new URL(res.url()).pathname),
  );
  await form.getByRole("button", { name: "Crear vehículo" }).click();

  const req = await peticion;
  const body = req.postDataJSON() as Record<string, unknown>;
  expect(body).toMatchObject({ make: "QA Mapaal", model: modelo, year: 2021, condition: "used" });
  expect(body).not.toHaveProperty("price_rd");
  expect(body).not.toHaveProperty("price_usd");
  expect(body).not.toHaveProperty("status");

  // 5. El backend lo acepta y la pantalla no queda en error.
  const res = await respuesta;
  expect(res.status(), `POST ${res.url()} -> ${res.status()}`).toBeGreaterThanOrEqual(200);
  expect(res.status()).toBeLessThan(300);
  await expect(page.getByTestId("vehicle-manual-error")).toHaveCount(0);
  await expect
    .poll(
      async () =>
        /^\/autos\/dealer\/inventario\/(?!nuevo$)[^/]+$/.test(new URL(page.url()).pathname) ||
        (await page.getByTestId("vehicle-manual-ack").count()) > 0,
      { timeout: 30_000 },
    )
    .toBe(true);

  console.log(`D3: POST ${res.status()} -> ${page.url()}`);
  console.log("RESULT_D3=PASS");
});
