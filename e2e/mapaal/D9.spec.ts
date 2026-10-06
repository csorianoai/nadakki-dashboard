/**
 * D9 — Centro Operativo (#575, #576, #577): el GUION COWORK hecho aserciones.
 * Contra BASE_URL con QA_USER/QA_PASSWORD, SOLO en el tenant QA (si la sesion es
 * de otro tenant, aborta). Si BASE_URL es el subdominio de otro dealer, solo el
 * login va por el host universal (ver `iniciarSesion`). Sin MFA: QA_TOTP_SECRET no se usa. El texto esperado
 * sale de `app/centro-operativo/contenido.ts`, el archivo que pinta la pantalla.
 *
 * Solo lectura. Unico `page.route` (D9.4): si el inventario QA tiene stock,
 * responde `{ vehicles: [] }` a ese GET para poder pulsar el boton que solo
 * existe con el inventario vacio; si esta vacio de verdad, pasa la respuesta real.
 * RESULT_D9=PASS se imprime al final del ultimo test, tras todas las aserciones.
 */
import { expect, test, type Browser, type Page, type Response } from "@playwright/test";

import { resolveDealerAdminHost } from "../../lib/dealer-management/admin-host";
import { contenidoCentroOperativo, type ContenidoCentroOperativo } from "../../app/centro-operativo/contenido";
import {
  ANCLA_PRIMEROS_PASOS, CTA_PRIMEROS_PASOS, ENLACE_MENU, GRUPO_MENU, NAV, PLACEHOLDER_TENANT, RUTAS,
  SLUG_QA, SUITE_OPERATIVA, TENANT_QA, TESTIDS, esInventario, fallosDePlantilla, huellaDespliegue,
  origenDeLogin, primerosPasosEsperado, vehiculosEnRespuesta,
} from "./d9-guion";

const BASE_URL = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";

test.use({ baseURL: BASE_URL || undefined, viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: "serial" });

let page: Page;
let contenido: ContenidoCentroOperativo;

/** Marca si "Primeros pasos" llega a pintarse, aunque sea un instante (#575 §5). */
async function observarPrimerosPasos(nueva: Page) {
  await nueva.addInitScript((testid: string) => {
    const w = window as unknown as { __d9PrimerosVisto?: boolean };
    w.__d9PrimerosVisto = false;
    new MutationObserver(() => {
      if (document.querySelector(`[data-testid="${testid}"]`)) w.__d9PrimerosVisto = true;
    }).observe(document, { childList: true, subtree: true });
  }, TESTIDS.primerosPasosInicio);
}

/**
 * Login del usuario QA y pagina en BASE_URL con su sesion.
 *
 * BASE_URL es `mapaal.nadakki.com`: ahi el login fija el tenant `mapaal` y el
 * usuario QA (tenant `mapaal-qa`) recibe 401. Entonces el login va por el host
 * universal --tras comprobar que sirve el mismo despliegue-- con el tenant QA
 * escrito, y la sesion (el refresh token de localStorage) se lleva a BASE_URL.
 * Fuera del login nada mira el host, asi que todo lo demas corre en BASE_URL.
 */
async function iniciarSesion(browser: Browser): Promise<Page> {
  const host = resolveDealerAdminHost(new URL(BASE_URL).hostname);
  const origenLogin = origenDeLogin(BASE_URL, host);
  const viewport = { width: 1440, height: 900 };
  const ctxLogin = await browser.newContext({ baseURL: BASE_URL, viewport });

  if (origenLogin !== BASE_URL) {
    const huellas = await Promise.all(
      [BASE_URL, origenLogin].map(async (o) => huellaDespliegue(await (await ctxLogin.request.get(`${o}/login`)).text())),
    );
    console.log(`D9 login: ${BASE_URL} no admite el tenant ${SLUG_QA}; login por ${origenLogin}`);
    expect(huellas[0], `sin huella de despliegue en ${BASE_URL}/login`).not.toBeNull();
    expect(huellas[1], `${origenLogin} no sirve el mismo despliegue que ${BASE_URL}`).toBe(huellas[0]);
  }

  const login = await ctxLogin.newPage();
  if (origenLogin === BASE_URL) await observarPrimerosPasos(login);
  await login.goto(`${origenLogin}/login`);
  await login.locator('input[type="email"]').fill(QA_USER);
  await login.locator('input[type="password"]').fill(QA_PASSWORD);
  // Solo hay campo de tenant fuera de un subdominio de dealer; el de mapaal-qa ya lo fija.
  if (origenLogin !== BASE_URL || host.mode !== "dealer_subdomain") {
    const campoTenant = login.getByPlaceholder(PLACEHOLDER_TENANT, { exact: true });
    await expect(campoTenant, "el login universal no pide el tenant").toBeVisible({ timeout: 30_000 });
    await campoTenant.fill(SLUG_QA);
  }
  await login.getByRole("button", { name: /Iniciar Sesi/i }).click();

  const errorDelFormulario = login.locator("form .bg-red-50");
  await expect
    .poll(
      async () => {
        if (!new URL(login.url()).pathname.startsWith("/login")) return "fuera";
        if (await errorDelFormulario.isVisible()) return `error: ${await errorDelFormulario.innerText()}`;
        return "esperando";
      },
      { timeout: 45_000, message: "el login no termino" },
    )
    .toBe("fuera");

  const tenant = await login.evaluate(() => window.localStorage.getItem("nadakki_tenant_id"));
  expect(tenant, "la sesion debe ser del tenant QA; con otro tenant el test no sigue").toBe(TENANT_QA);
  if (origenLogin === BASE_URL) return login;

  // La misma sesion, ahora en BASE_URL. Se cierra el login antes para que no
  // rote el refresh token por su cuenta.
  const estado = await ctxLogin.storageState();
  await ctxLogin.close();
  const deLogin = estado.origins.find((o) => o.origin === new URL(origenLogin).origin);
  expect(deLogin?.localStorage.length, "el login no dejo sesion en localStorage").toBeGreaterThan(0);
  const ctx = await browser.newContext({
    baseURL: BASE_URL,
    viewport,
    storageState: { cookies: [], origins: [{ origin: new URL(BASE_URL).origin, localStorage: deLogin!.localStorage }] },
  });
  const nueva = await ctx.newPage();
  await observarPrimerosPasos(nueva);
  await nueva.goto(RUTAS.inicio);
  await expect(nueva, "la sesion no paso a BASE_URL").toHaveURL((url) => url.pathname === RUTAS.inicio, {
    timeout: 45_000,
  });
  return nueva;
}

const navDealer = () => page.getByRole("navigation", { name: NAV.dealer }).first();

/** Dentro del panel del dealer, con una sola navegacion: ni la de la Suite ni la del marketplace (#576). */
async function soloChromeDelDealer() {
  await expect(navDealer()).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId("dealer-context-aviso"), "el panel del dealer no resolvio el dealer").toHaveCount(0);
  await expect(page.locator(`[aria-label="${NAV.suite}"]`), "barra de la Suite apilada").toHaveCount(0);
  await expect(page.locator(`[aria-label="${NAV.suiteModulos}"]`), "hubs de la Suite apilados").toHaveCount(0);
  await expect(page.locator(`nav[aria-label="${NAV.marketplace}"]`), "barra del marketplace apilada").toHaveCount(0);
  await expect(page.getByText(SUITE_OPERATIVA, { exact: true })).toHaveCount(0);
}

/** La guia entera, leida del archivo de datos. */
async function guiaCompleta() {
  await expect(page.getByRole("heading", { level: 1, name: contenido.titulo })).toBeVisible({ timeout: 45_000 });
  for (const bloque of contenido.bloques) {
    const art = page.getByTestId(TESTIDS.bloque(bloque.id));
    await expect(art.getByRole("heading", { level: 2, name: bloque.titulo })).toBeVisible();
    for (const paso of bloque.pasos ?? []) await expect(art.getByText(paso, { exact: true })).toBeVisible();
    if (bloque.advertencia)
      await expect(page.getByTestId(TESTIDS.advertencia(bloque.id))).toHaveText(bloque.advertencia);
  }
  for (const cuenta of contenido.cuentas)
    await expect(page.getByTestId(TESTIDS.cuentas)).toContainText(cuenta.codigo);
  await expect(page.getByTestId(TESTIDS.reglaFinal)).toHaveText(contenido.reglaFinal);
}

async function irAInicio() {
  await page.goto(RUTAS.inicio);
  await expect(page).toHaveURL((url) => url.pathname === RUTAS.inicio, { timeout: 45_000 });
  await expect(navDealer()).toBeVisible({ timeout: 45_000 });
}

test.describe("D9 — Centro Operativo dentro del panel del dealer", () => {
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    // Sin credenciales no hay prueba: fallar, no saltar (un skip saldria verde).
    expect(BASE_URL, "falta BASE_URL").not.toBe("");
    expect(QA_USER, "falta QA_USER").not.toBe("");
    expect(QA_PASSWORD, "falta QA_PASSWORD").not.toBe("");
    page = await iniciarSesion(browser);
    contenido = contenidoCentroOperativo(TENANT_QA);
  });

  test.afterAll(async () => await page?.context().close());

  test("D9.1: menu del dealer -> Operacion -> Centro Operativo, guia completa y una sola navegacion", async () => {
    test.setTimeout(120_000);
    await irAInicio();

    const grupo = navDealer()
      .locator("div")
      .filter({ has: page.getByRole("heading", { name: GRUPO_MENU, exact: true }) });
    const enlace = grupo.getByRole("link", { name: ENLACE_MENU, exact: true });
    await expect(enlace, `"${ENLACE_MENU}" no esta en el grupo ${GRUPO_MENU} del menu`).toBeVisible();
    await enlace.click();

    await expect(page).toHaveURL((url) => url.pathname === RUTAS.centro && url.hash === "", { timeout: 45_000 });
    await guiaCompleta();
    await soloChromeDelDealer();
    await expect(navDealer().getByRole("link", { name: ENLACE_MENU, exact: true })).toHaveAttribute("aria-current", "page");

    // F5: sigue dentro del panel del dealer.
    await page.reload();
    await guiaCompleta();
    await soloChromeDelDealer();
  });

  test("D9.2: la tarjeta de Accesos rapidos del Inicio lleva al Centro Operativo", async () => {
    test.setTimeout(90_000);
    await irAInicio();
    const tarjeta = page.locator(`[data-testid="${TESTIDS.accesoLibre}"][href="${RUTAS.centro}"]`);
    await expect(tarjeta).toBeVisible({ timeout: 45_000 });
    await expect(tarjeta).toContainText(ENLACE_MENU);
    await tarjeta.click();
    await expect(page).toHaveURL((url) => url.pathname === RUTAS.centro, { timeout: 45_000 });
    await guiaCompleta();
    await soloChromeDelDealer();
  });

  test("D9.3: 'Primeros pasos' en Inicio solo con el inventario vacio confirmado", async () => {
    test.setTimeout(150_000);
    const bloque = contenido.bloques.find((b) => b.id === ANCLA_PRIMEROS_PASOS);
    expect(bloque, "el archivo de datos no tiene el bloque primeros-pasos").toBeTruthy();

    // El guion pide recargar varias veces: tres vueltas.
    for (let vuelta = 1; vuelta <= 3; vuelta++) {
      const respuestas: { status: number; vehiculos: number | null }[] = [];
      const escuchar = async (resp: Response) => {
        if (!esInventario(resp.url(), resp.request().method())) return;
        const cuerpo = await resp.json().catch(() => null);
        respuestas.push({ status: resp.status(), vehiculos: vehiculosEnRespuesta(cuerpo) });
      };
      page.on("response", escuchar);
      await irAInicio();
      // Esperar a que el inventario conteste (o a que no haga falta pedirlo).
      await expect
        .poll(() => respuestas.length, { timeout: 30_000, message: "el Inicio no pidio el inventario" })
        .toBeGreaterThan(0)
        .catch(() => undefined);
      await page.waitForTimeout(1_500);
      page.off("response", escuchar);

      const esperado = primerosPasosEsperado(respuestas);
      console.log(`D9.3 vuelta ${vuelta}: inventario ${JSON.stringify(respuestas)} -> Primeros pasos ${esperado ? "SI" : "NO"}`);
      const seccion = page.getByTestId(TESTIDS.primerosPasosInicio);
      if (esperado) {
        await expect(seccion).toBeVisible({ timeout: 20_000 });
        await expect(seccion.getByRole("heading", { name: bloque!.titulo })).toBeVisible();
        for (const paso of bloque!.pasos ?? []) await expect(seccion.getByText(paso, { exact: true })).toBeVisible();
        await expect(seccion.getByTestId(TESTIDS.primerosPasosCta)).toHaveText(CTA_PRIMEROS_PASOS);
      } else {
        await expect(seccion, "Primeros pasos con stock, con error o sin inventario").toHaveCount(0);
        const visto = await page.evaluate(
          () => (window as unknown as { __d9PrimerosVisto?: boolean }).__d9PrimerosVisto === true,
        );
        expect(visto, "Primeros pasos asomo un instante mientras cargaba").toBe(false);
      }
      // Las dos puertas siguen ahi en cualquier caso (#575 §4.3).
      await expect(navDealer().getByRole("link", { name: ENLACE_MENU, exact: true })).toBeVisible();
      await expect(page.locator(`[data-testid="${TESTIDS.accesoLibre}"][href="${RUTAS.centro}"]`)).toBeVisible();
    }
  });

  test("D9.4: 'Empezar: cargar mi stock' aterriza en primeros pasos dentro del panel del dealer", async () => {
    test.setTimeout(120_000);
    let modo = "sin respuesta";
    await page.route(
      (url) => esInventario(url.toString(), "GET"),
      async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        const real = await route.fetch();
        const vehiculos = vehiculosEnRespuesta(await real.json().catch(() => null));
        if (real.ok() && vehiculos === 0) {
          modo = "inventario vacio real";
          return route.fulfill({ response: real });
        }
        modo = `inventario real con ${vehiculos ?? "?"} vehiculos (status ${real.status()}): se responde vacio`;
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ vehicles: [] }) });
      },
    );
    try {
      await irAInicio();
      const cta = page.getByTestId(TESTIDS.primerosPasosCta);
      await expect(cta).toBeVisible({ timeout: 45_000 });
      console.log(`D9.4: ${modo}`);
      await expect(cta).toHaveText(CTA_PRIMEROS_PASOS);
      await cta.click();
    } finally {
      await page.unrouteAll({ behavior: "ignoreErrors" });
    }

    await expect(page).toHaveURL(
      (url) => url.pathname === RUTAS.centro && url.hash === `#${ANCLA_PRIMEROS_PASOS}`,
      { timeout: 45_000 },
    );
    const seccion = page.locator(`#${ANCLA_PRIMEROS_PASOS}`);
    await expect(seccion).toBeVisible({ timeout: 45_000 });
    await expect(seccion, "el boton no bajo a la seccion de primeros pasos").toBeInViewport();
    const bloque = contenido.bloques.find((b) => b.id === ANCLA_PRIMEROS_PASOS)!;
    await expect(seccion.getByRole("heading", { name: bloque.titulo })).toBeInViewport();
    if (bloque.advertencia)
      await expect(page.getByTestId(TESTIDS.advertencia(ANCLA_PRIMEROS_PASOS))).toHaveText(bloque.advertencia);
    await soloChromeDelDealer();

    // Inicio desde ese menu vuelve sin pasar por otra barra.
    await navDealer().getByRole("link", { name: "Inicio", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === RUTAS.inicio, { timeout: 45_000 });
    await soloChromeDelDealer();
  });

  test("D9.5: el boton de la plantilla sigue al archivo de datos", async () => {
    test.setTimeout(90_000);
    await page.goto(`${RUTAS.centro}#${ANCLA_PRIMEROS_PASOS}`);
    await guiaCompleta();
    await soloChromeDelDealer();

    const conPlantilla = contenido.bloques.filter((b) => b.plantilla);
    const botones = page.getByTestId(TESTIDS.plantilla);
    // Sin plantilla declarada no hay boton, ni uno roto (#577 §4).
    await expect(botones).toHaveCount(conPlantilla.length);

    for (const bloque of conPlantilla) {
      const plantilla = bloque.plantilla!;
      const boton = page.getByTestId(TESTIDS.bloque(bloque.id)).getByTestId(TESTIDS.plantilla);
      await expect(boton).toBeVisible();
      await expect(boton).toHaveText(plantilla.etiqueta);
      await expect(boton).toHaveAttribute("href", plantilla.ruta);
      await expect(boton).toHaveAttribute("download", plantilla.ruta.split("/").pop()!);
      await expect(boton).toHaveAttribute("data-version", plantilla.version);
      await expect(page.getByTestId(TESTIDS.bloque(bloque.id)).getByText(plantilla.descripcion)).toBeVisible();

      const servida = await page.request.get(plantilla.ruta);
      const fallos = fallosDePlantilla(plantilla, { status: servida.status(), bytes: new Uint8Array(await servida.body()) });
      expect(fallos, `plantilla de ${bloque.id}`).toEqual([]);

      const [descarga] = await Promise.all([page.waitForEvent("download"), boton.click()]);
      expect(descarga.suggestedFilename(), "el navegador descarga, no abre una pestana").toContain(plantilla.version);
    }

    console.log(
      `D9.5: plantilla ${conPlantilla.length ? conPlantilla.map((b) => b.plantilla!.ruta).join(", ") : "sin declarar: sin boton"}`,
    );
    console.log("RESULT_D9=PASS");
  });
});
