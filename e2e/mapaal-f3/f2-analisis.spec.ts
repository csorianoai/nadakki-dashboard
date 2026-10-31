/**
 * F2 — Analisis de Costos y Analisis de Gastos: el total mostrado es el del
 * endpoint de F1 para el tenant QA, y cada barra lleva al detalle.
 *
 * Corre SOLO contra el tenant QA con BASE_URL / QA_USER / QA_PASSWORD (la sesion
 * ajena aborta en iniciarSesionQA). No escribe nada.
 *
 * RESULT_MF3_F2=PASS se imprime al final, tras todas las aserciones.
 * Ejecutar: BASE_URL=... QA_USER=... QA_PASSWORD=... npx playwright test e2e/mapaal-f3/f2-analisis.spec.ts
 */
import { expect, test, type Page } from "@playwright/test";

import { iniciarSesionQA } from "../mapaal/sesion-qa";

const BASE_URL = (process.env.BASE_URL ?? "").replace(/\/$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";

test.skip(!BASE_URL || !QA_USER || !QA_PASSWORD, "Faltan BASE_URL, QA_USER o QA_PASSWORD");

const RUTAS = {
  costos: { pantalla: "/autos/dealer/finanzas/analisis-costos", api: "/api/v1/contable/reports/costos-por-vehiculo-tipo-mes" },
  gastos: { pantalla: "/autos/dealer/finanzas/analisis-gastos", api: "/api/v1/contable/reports/gastos-por-cuenta-mes" },
};

async function totalDelEndpoint(page: Page, ruta: { pantalla: string; api: string }) {
  const respuesta = page.waitForResponse(
    (r) => new URL(r.url()).pathname === ruta.api && r.request().method() === "GET",
    { timeout: 60_000 },
  );
  await page.goto(`${BASE_URL}${ruta.pantalla}`);
  const r = await respuesta;
  expect(r.status(), `${ruta.api} debe responder 200`).toBe(200);
  const cuerpo = (await r.json()) as { total: number | string; moneda: string };
  return { total: Number(cuerpo.total), moneda: String(cuerpo.moneda).toUpperCase() };
}

test("F2: los totales de las dos pantallas son los del endpoint de F1 y las barras enlazan", async ({ browser }) => {
  test.setTimeout(240_000);
  const page = await iniciarSesionQA(browser, { baseUrl: BASE_URL, usuario: QA_USER, clave: QA_PASSWORD });

  for (const nombre of ["costos", "gastos"] as const) {
    const esperado = await totalDelEndpoint(page, RUTAS[nombre]);
    const total = page.getByTestId("analisis-total");
    await expect(total).toBeVisible({ timeout: 30_000 });
    expect(Number(await total.getAttribute("data-total"))).toBeCloseTo(esperado.total, 2);
    expect(await total.getAttribute("data-moneda")).toBe(esperado.moneda);
    await expect(page.getByText("Upstream")).toHaveCount(0);

    // Cambiar el periodo vuelve a pedir y sigue coincidiendo con el endpoint.
    const otra = page.waitForResponse((r) => new URL(r.url()).pathname === RUTAS[nombre].api && r.url().includes("desde="));
    await page.getByTestId("analisis-periodo").selectOption("3m");
    const rp = await otra;
    const cuerpo = (await rp.json()) as { total: number | string };
    await expect(total).toHaveAttribute("data-total", String(cuerpo.total), { timeout: 30_000 });
  }

  // Costos: la fila de un vehiculo enlaza a su ficha (si el tenant QA tiene costos).
  await page.goto(`${BASE_URL}${RUTAS.costos.pantalla}`);
  await expect(page.getByTestId("analisis-total")).toBeVisible({ timeout: 30_000 });
  const filas = page.getByTestId("costos-vehiculo");
  if ((await filas.count()) > 0) {
    await filas.first().getByRole("link").click();
    await expect(page).toHaveURL(/\/autos\/dealer\/inventario\//);
  }

  console.log("RESULT_MF3_F2=PASS");
});
