/**
 * D8 — Libro mayor y Balance abren sin cerrar la sesion, y la facturacion
 * electronica de un tenant AR dice "se gestiona en ARCA" (#573, #574).
 *
 * Corre SOLO contra el tenant QA, con `QA_USER` / `QA_PASSWORD` (si la sesion
 * es de otro tenant, aborta). Nunca con credenciales de usuarios reales de
 * Mapaal. El login de la app no tiene paso MFA, asi que `QA_TOTP_SECRET` no se
 * usa. No escribe nada: solo navega y lee.
 *
 * Login: BASE_URL es `mapaal.nadakki.com`, cuyo login fija el tenant `mapaal`;
 * el usuario QA (`mapaal-qa`) ahi recibe 401. Como en D9, el login va por el
 * host universal (tras comprobar que es el mismo despliegue) con el tenant QA
 * escrito, y la sesion se lleva a BASE_URL. Todo lo demas corre en BASE_URL.
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
import {
  expect,
  test,
  type Browser,
  type Page,
  type Response,
} from "@playwright/test";

import { resolveDealerAdminHost } from "../../lib/dealer-management/admin-host";
import {
  ARCA_TITULO,
  REINTENTAR,
  RUTAS,
  SESION_FALLIDA,
  SESION_VERIFICANDO,
  TESTIDS,
  TITULOS,
  esLogin,
  esPeticionFiscal,
  esRefresh,
  fallaFiscalAR,
} from "./d8-guion";
import {
  PLACEHOLDER_TENANT,
  SLUG_QA,
  TENANT_QA,
  huellaDespliegue,
  origenDeLogin,
} from "./d9-guion";

const BASE_URL = (
  process.env.BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  ""
).replace(/\/$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";
const PAIS_FISCAL = (process.env.D8_FISCAL_COUNTRY ?? "AR").toUpperCase();

const PLAN = RUTAS.plan;
const LIBRO = RUTAS.libro;
const BALANCE = RUTAS.balance;

test.describe.configure({ mode: "serial" });
test.skip(
  !BASE_URL || !QA_USER || !QA_PASSWORD,
  "Faltan BASE_URL, QA_USER o QA_PASSWORD",
);

const VIEWPORT = { width: 1440, height: 900 };

/**
 * Login del usuario QA y una pagina en BASE_URL con su sesion (ver cabecera).
 * Cada test navega despues a su pantalla con `page.goto`.
 */
async function sesionQA(browser: Browser): Promise<Page> {
  const host = resolveDealerAdminHost(new URL(BASE_URL).hostname);
  const origenLogin = origenDeLogin(BASE_URL, host);
  const ctxLogin = await browser.newContext({ viewport: VIEWPORT });

  if (origenLogin !== BASE_URL) {
    const huellas = await Promise.all(
      [BASE_URL, origenLogin].map(async (o) =>
        huellaDespliegue(
          await (await ctxLogin.request.get(`${o}/login`)).text(),
        ),
      ),
    );
    console.log(
      `D8 login: ${BASE_URL} no admite el tenant ${SLUG_QA}; login por ${origenLogin}`,
    );
    expect(
      huellas[0],
      `sin huella de despliegue en ${BASE_URL}/login`,
    ).not.toBeNull();
    expect(
      huellas[1],
      `${origenLogin} no sirve el mismo despliegue que ${BASE_URL}`,
    ).toBe(huellas[0]);
  }

  const login = await ctxLogin.newPage();
  await login.goto(`${origenLogin}/login`);
  await login.locator('input[type="email"]').fill(QA_USER);
  await login.locator('input[type="password"]').fill(QA_PASSWORD);
  // Solo hay campo de tenant fuera de un subdominio de dealer; `exact` porque
  // el placeholder del email ("admin@tu-institucion.com") lo contiene.
  if (origenLogin !== BASE_URL || host.mode !== "dealer_subdomain") {
    const campoTenant = login.getByPlaceholder(PLACEHOLDER_TENANT, {
      exact: true,
    });
    await expect(
      campoTenant,
      "el login universal no pide el tenant",
    ).toBeVisible({
      timeout: 30_000,
    });
    await campoTenant.fill(SLUG_QA);
  }
  await login.getByRole("button", { name: /Iniciar Sesi/i }).click();

  // Sale de /login o dice por que no (p. ej. "Credenciales invalidas"), sin agotar 60 s en silencio.
  const errorDelFormulario = login.locator("form .bg-red-50");
  await expect
    .poll(
      async () => {
        if (!esLogin(new URL(login.url()).pathname)) return "fuera";
        if (await errorDelFormulario.isVisible())
          return `error: ${await errorDelFormulario.innerText()}`;
        return "esperando";
      },
      { timeout: 60_000, message: "el login no termino" },
    )
    .toBe("fuera");

  const tenant = await login.evaluate(() =>
    window.localStorage.getItem("nadakki_tenant_id"),
  );
  expect(
    tenant,
    "la sesion debe ser del tenant QA; con otro tenant el test no sigue",
  ).toBe(TENANT_QA);

  if (origenLogin === BASE_URL) return login;

  // La misma sesion, ahora en BASE_URL. Se cierra el login antes para que no
  // rote el refresh token por su cuenta.
  const estado = await ctxLogin.storageState();
  await ctxLogin.close();
  const deLogin = estado.origins.find(
    (o) => o.origin === new URL(origenLogin).origin,
  );
  expect(
    deLogin?.localStorage.length,
    "el login no dejo sesion en localStorage",
  ).toBeGreaterThan(0);
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: new URL(BASE_URL).origin,
          localStorage: deLogin!.localStorage,
        },
      ],
    },
  });
  return ctx.newPage();
}

/** La pantalla contable cargo dentro de la sesion: titulo pintado, sin /login ni error de sesion. */
async function pantallaConSesion(page: Page, ruta: string, titulo: string) {
  await expect(page.getByRole("heading", { name: titulo }).first()).toBeVisible(
    { timeout: 45_000 },
  );
  expect(new URL(page.url()).pathname).toBe(ruta);
  await expect(page.getByText(SESION_FALLIDA)).toHaveCount(0);
  await expect(page.getByText(SESION_VERIFICANDO)).toHaveCount(0);
  await expect(page.getByText(/Upstream/)).toHaveCount(0);
}

/** Salto por el menu (navegacion de cliente); si el enlace no esta en el menu, por URL. */
async function ir(page: Page, ruta: string) {
  const enlace = page.locator(`a[href="${ruta}"]`).first();
  if ((await enlace.count()) > 0 && (await enlace.isVisible()))
    await enlace.click();
  else await page.goto(`${BASE_URL}${ruta}`);
  await page.waitForURL(
    (url) => url.pathname === ruta || esLogin(url.pathname),
    { timeout: 45_000 },
  );
}

async function libroMayorCargado(page: Page) {
  await pantallaConSesion(page, LIBRO, TITULOS.libro);
  await expect(page.getByLabel("Cuenta", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Periodo", { exact: true })).toBeVisible();
  // Si cuentas/periodos fallan, la pantalla lo dice con Reintentar; no debe hacer falta.
  await expect(page.getByTestId(TESTIDS.errorReintentar)).toHaveCount(0);
}

async function balanceCargado(page: Page) {
  await pantallaConSesion(page, BALANCE, TITULOS.balance);
  await expect(page.getByLabel("Periodo", { exact: true })).toBeVisible();
  await expect(page.getByTestId(TESTIDS.errorReintentar)).toHaveCount(0);
}

test("D8.1: Plan de cuentas dice que la facturacion electronica se gestiona en ARCA", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const page = await sesionQA(browser);

  const fiscal = page.waitForResponse(
    (res: Response) => esPeticionFiscal(res.url()),
    { timeout: 45_000 },
  );
  await page.goto(`${BASE_URL}${PLAN}`);
  await pantallaConSesion(page, PLAN, TITULOS.plan);

  const res = await fiscal;
  const cuerpo = await res.text();
  console.log(
    `D8: GET ${new URL(res.url()).pathname} -> ${res.status()} ${cuerpo.slice(0, 200)}`,
  );
  // #573: el proxy reenvia el cuerpo del backend tal cual, sin envolverlo.
  expect(cuerpo).not.toContain("Upstream error");

  if (PAIS_FISCAL === "AR") {
    expect(fallaFiscalAR(res.status(), cuerpo)).toBeNull();
    const arca = page.getByTestId(TESTIDS.arca);
    await expect(arca).toBeVisible({ timeout: 30_000 });
    await expect(arca).toHaveAttribute("role", "note");
    await expect(arca).toContainText(ARCA_TITULO);
    await expect(page.getByTestId(TESTIDS.problema)).toHaveCount(0);
  }
});

test("D8.2: Libro mayor y Balance abren, aguantan F5 y la navegacion, sin /login", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const page = await sesionQA(browser);

  await page.goto(`${BASE_URL}${PLAN}`);
  await pantallaConSesion(page, PLAN, TITULOS.plan);

  await page.goto(`${BASE_URL}${LIBRO}`);
  await libroMayorCargado(page);
  if (PAIS_FISCAL === "AR")
    await expect(page.getByTestId(TESTIDS.arca)).toBeVisible({
      timeout: 30_000,
    });
  await page.reload();
  await libroMayorCargado(page);

  await page.goto(`${BASE_URL}${BALANCE}`);
  await balanceCargado(page);
  if (PAIS_FISCAL === "AR")
    await expect(page.getByTestId(TESTIDS.arca)).toBeVisible({
      timeout: 30_000,
    });
  await page.reload();
  await balanceCargado(page);

  // Ida y vuelta por el menu, sin recargar: ningun salto pide login.
  for (let vuelta = 0; vuelta < 2; vuelta++) {
    await ir(page, PLAN);
    await pantallaConSesion(page, PLAN, TITULOS.plan);
    await ir(page, LIBRO);
    await libroMayorCargado(page);
    await ir(page, BALANCE);
    await balanceCargado(page);
  }
});

test("D8.3: un refresh que falla con 504 no cierra la sesion y Reintentar la recupera", async ({
  browser,
}) => {
  test.setTimeout(150_000);
  const page = await sesionQA(browser);
  await page.goto(`${BASE_URL}${PLAN}`);
  await pantallaConSesion(page, PLAN, TITULOS.plan);

  // Solo el PRIMER refresh tras la recarga falla, como un backend frio.
  let fallados = 0;
  await page.route((url) => esRefresh(url.href), async (route) => {
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
  const aviso = page.getByText(SESION_FALLIDA);
  await expect(aviso).toBeVisible({ timeout: 30_000 });
  expect(fallados).toBe(1);
  expect(new URL(page.url()).pathname).toBe(LIBRO);

  await page.getByRole("button", { name: REINTENTAR }).click();
  await libroMayorCargado(page);
  await expect(aviso).toHaveCount(0);
  expect(esLogin(new URL(page.url()).pathname)).toBe(false);

  console.log("RESULT_D8=PASS");
});
