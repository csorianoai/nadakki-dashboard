/**
 * D1 — Inventario visible, caso de UNA asignacion (Mapaal).
 *
 * Es el GUION COWORK de #570 convertido en aserciones. Se ejecuta contra
 * produccion (BASE_URL, mapaal.nadakki.com) con el usuario QA, y SOLO con el:
 * si el tenant de la sesion no es el tenant QA, el test aborta antes de abrir
 * ninguna pantalla con datos. El login NO se hace en BASE_URL: ese host fija el
 * tenant `mapaal` y el usuario QA es de `mapaal-qa` (401). Lo hace
 * `iniciarSesionQA` (sesion-qa.ts) por el host universal y lleva la sesion a BASE_URL.
 *
 *   npx playwright test e2e/mapaal/D1.spec.ts --reporter=line
 *
 * Fuera de este fichero: el caso de VARIAS asignaciones (selector) y el de CERO.
 * Las herramientas QA solo crean usuarios con un dealer, asi que aqui no hay con
 * quien probarlos; los cubren tests/app/InventarioSelectorDealer.test.tsx y
 * tests/app/InventarioSoloBatch.test.tsx.
 *
 * Solo lectura: el unico `page.route` RETRASA la respuesta de dealer-context
 * para poder ver el estado intermedio. No cambia ni inventa ninguna respuesta.
 */

import { expect, test, type Page, type Request } from "@playwright/test";

import { iniciarSesionQA } from "./sesion-qa";

import {
  DEALER_CONTEXT,
  VEHICLES,
  fallosDeCronologia,
  interesa,
  leerAsignacionUnica,
  pathOf,
  type Evento,
} from "./d1-red";

const BASE_URL = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";

/** El tiempo que se retiene dealer-context para ver "Verificando". */
const RETENCION_MS = 2_000;

test.use({ baseURL: BASE_URL || undefined });

function registrarRed(page: Page) {
  const eventos: Evento[] = [];
  let seq = 0;

  page.on("request", (req: Request) => {
    if (interesa(req.url())) eventos.push({ tipo: "request", ruta: pathOf(req.url()), url: req.url(), seq: seq++ });
  });
  page.on("requestfinished", (req: Request) => {
    if (interesa(req.url())) eventos.push({ tipo: "response", ruta: pathOf(req.url()), url: req.url(), seq: seq++ });
  });
  return eventos;
}

test.describe("D1 — inventario visible, una asignacion", () => {
  test.beforeAll(() => {
    // Sin credenciales no hay prueba: fallar, no saltar (un skip saldria verde).
    expect(BASE_URL, "falta BASE_URL").not.toBe("");
    expect(QA_USER, "falta QA_USER").not.toBe("");
    expect(QA_PASSWORD, "falta QA_PASSWORD").not.toBe("");
  });

  test("Carolina: dealer-context, luego /vehicles con ese dealer, sin selector; el logout borra el binding", async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    // El login va donde existe el tenant QA (ver sesion-qa.ts); la pagina ya esta en BASE_URL.
    let page!: Page;
    await test.step("entrar como el usuario QA", async () => {
      page = await iniciarSesionQA(browser, { baseUrl: BASE_URL, usuario: QA_USER, clave: QA_PASSWORD });
    });

    const eventos = registrarRed(page);
    let respuestaContexto: { status: number; body: unknown } | null = null;
    page.on("response", async (res) => {
      if (!DEALER_CONTEXT.test(pathOf(res.url())) || res.request().method() !== "GET") return;
      const status = res.status();
      const body = await res.json().catch(() => null);
      respuestaContexto ??= { status, body };
    });

    // Se retiene dealer-context: mientras tanto el inventario NO puede pintarse.
    let liberar: () => void = () => {};
    const liberado = new Promise<void>((resolve) => (liberar = resolve));
    await page.route(DEALER_CONTEXT, async (route) => {
      await Promise.race([liberado, new Promise((r) => setTimeout(r, RETENCION_MS))]);
      await route.continue();
    });

    await test.step("panel del dealer -> Inventario: mientras resuelve, 'Verificando' y nada mas", async () => {
      await page.goto("/autos/dealer/inventario");
      await expect(page.getByTestId("dealer-context-verificando")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("heading", { name: "Inventario" })).toHaveCount(0);
      expect(eventos.filter((e) => VEHICLES.test(e.ruta)), "inventario pedido antes de dealer-context").toHaveLength(0);
      liberar();
    });

    let dealerId = "";
    let unidad: string | null = null;

    await test.step("GET dealer-context -> 200 con UNA asignacion", async () => {
      await expect.poll(() => respuestaContexto, { timeout: 30_000 }).not.toBeNull();
      const { status, body } = respuestaContexto!;
      expect(status, "dealer-context debe responder 200").toBe(200);
      const asignacion = leerAsignacionUnica(body);
      expect(asignacion.ok ? "" : asignacion.motivo, "dealer-context con UNA asignacion").toBe("");
      if (asignacion.ok) ({ dealerId, unidad } = asignacion);
    });

    await test.step("la lista: con datos o vacia con el texto del contrato", async () => {
      await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible({ timeout: 30_000 });
      const vacia = page.getByText("No hay vehículos reportados por el contrato privado para este dealer.");
      const conDatos = page.getByRole("link", { name: "Ver ficha" }).first();
      await expect(vacia.or(conDatos)).toBeVisible({ timeout: 30_000 });
    });

    await test.step("red: /vehicles con el dealer_id del contrato, despues de su respuesta, y un solo dealer-context", async () => {
      expect(fallosDeCronologia(eventos, dealerId), "cronologia de la red").toEqual([]);
    });

    await test.step("pantalla: sin selector, sin DEFAULT_DENY, sin avisos de error", async () => {
      await expect(page.getByTestId("inventario-selector-dealer")).toHaveCount(0);
      await expect(page.getByTestId("dealer-context-aviso")).toHaveCount(0);
      for (const id of [
        "inventario-sin-dealer",
        "inventario-error",
        "inventario-asignaciones-error",
        "inventario-denegado",
        "inventario-no-verificado",
        "inventario-error-acceso",
        "inventario-error-red",
        "inventario-sin-decision",
      ]) {
        await expect(page.getByTestId(id), `aviso ${id}`).toHaveCount(0);
      }
      await expect(page.locator("body")).not.toContainText("DEFAULT_DENY");
      await expect(page.locator("body")).not.toContainText("No incluido en tu plan");
    });

    await test.step("localStorage: el binding con los valores del backend", async () => {
      const guardado = await page.evaluate(() => ({
        dealer: window.localStorage.getItem("nadakki_dealer_id"),
        unidad: window.localStorage.getItem("nadakki_organization_unit_id"),
      }));
      expect(guardado.dealer).toBe(dealerId);
      expect(guardado.unidad).toBe(unidad);
    });

    await test.step("cerrar sesion: el binding desaparece", async () => {
      await page.unroute(DEALER_CONTEXT);
      await page.goto("/logout");
      await page.waitForURL(/\/login/, { timeout: 30_000 });
      const tras = await page.evaluate(() => ({
        dealer: window.localStorage.getItem("nadakki_dealer_id"),
        unidad: window.localStorage.getItem("nadakki_organization_unit_id"),
      }));
      expect(tras.dealer, "nadakki_dealer_id sobrevive al logout").toBeNull();
      expect(tras.unidad, "nadakki_organization_unit_id sobrevive al logout").toBeNull();
    });

    await page.context().close();
    console.log("RESULT_D1=PASS");
  });
});
