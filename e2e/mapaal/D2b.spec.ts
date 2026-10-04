/**
 * D2b — la Suite no muestra la plataforma a usuarios de tenant.
 *
 * Corre SOLO contra el tenant QA (`mapaal-qa`), con `QA_USER` / `QA_PASSWORD`.
 * Nunca con credenciales de usuarios reales de Mapaal. El login no tiene MFA, asi que
 * `QA_TOTP_SECRET` no se usa.
 *
 * Guion:
 *   1. Inicia sesion. El usuario QA tiene dealer (las herramientas QA solo
 *      crean usuarios con un dealer, ver D1.spec.ts), asi que la Suite DEBE
 *      redirigir a /autos/dealer y "Suite operativa" no aparece nunca.
 *   2. En Inicio no estan las metricas de plataforma.
 *   3. Ningun enlace lleva a /tenants ("Cambiar tenant" ya no apunta ahi).
 *   4. /tenants no ensena los tenants inventados y tambien redirige al panel
 *      del dealer.
 *
 * Si BASE_URL es el subdominio de otro dealer (`mapaal.nadakki.com`), el login
 * va por el host universal con el tenant QA y la sesion se lleva a BASE_URL,
 * como en D9 (`origenDeLogin`).
 *
 * Ejecutar: BASE_URL=... QA_USER=... QA_PASSWORD=... \
 *   npx playwright test e2e/mapaal/D2b.spec.ts
 */
import { expect, test, type Browser, type Page } from "@playwright/test";

import { resolveDealerAdminHost } from "../../lib/dealer-management/admin-host";
import {
  DOMINIOS_CATALOGO, LEGAL_HUB, RUTA_DEALER, RUTA_TENANTS, SUITE_OPERATIVA, TENANT_QA, TENANTS_INVENTADOS, TESTIDS,
  enPanelDealer,
} from "./d2b-guion";
import { PLACEHOLDER_TENANT, SLUG_QA, huellaDespliegue, origenDeLogin } from "./d9-guion";

const BASE_URL = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";

// Una sola sesion para todo el guion: el login en produccion es lento y cada
// login nuevo rotaria el refresh token.
test.describe.configure({ mode: "serial", timeout: 120_000 });

let page: Page;

/**
 * Login del usuario QA y pagina en BASE_URL con su sesion (mismo esquema que D9).
 *
 * En `mapaal.nadakki.com` no hay campo de tenant y el login fija `mapaal`: el
 * usuario de `mapaal-qa` recibe 401 y el spec se quedaba en /login. Ademas,
 * buscar el placeholder "tu-institucion" sin `exact` casaba con el email
 * ("admin@tu-institucion.com") y le escribia el slug encima.
 */
async function iniciarSesion(browser: Browser): Promise<Page> {
  const host = resolveDealerAdminHost(new URL(BASE_URL).hostname);
  const origenLogin = origenDeLogin(BASE_URL, host);
  const ctxLogin = await browser.newContext({ baseURL: BASE_URL });

  if (origenLogin !== BASE_URL) {
    const huellas = await Promise.all(
      [BASE_URL, origenLogin].map(async (o) => huellaDespliegue(await (await ctxLogin.request.get(`${o}/login`)).text())),
    );
    console.log(`D2b login: ${BASE_URL} no admite el tenant ${SLUG_QA}; login por ${origenLogin}`);
    expect(huellas[0], `sin huella de despliegue en ${BASE_URL}/login`).not.toBeNull();
    expect(huellas[1], `${origenLogin} no sirve el mismo despliegue que ${BASE_URL}`).toBe(huellas[0]);
  }

  const login = await ctxLogin.newPage();
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

  // O sale de /login, o el formulario dice por que no.
  const errorDelFormulario = login.locator("form .bg-red-50");
  await expect
    .poll(
      async () => {
        if (!new URL(login.url()).pathname.startsWith("/login")) return "fuera";
        if (await errorDelFormulario.isVisible()) return `error: ${await errorDelFormulario.innerText()}`;
        return "esperando";
      },
      { timeout: 60_000, message: "el login no termino" },
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
    storageState: { cookies: [], origins: [{ origin: new URL(BASE_URL).origin, localStorage: deLogin!.localStorage }] },
  });
  return ctx.newPage();
}

/** Espera a que el gate de la Suite termine de verificar. */
async function esperarVerificacion(page: Page) {
  await expect(page.getByTestId(TESTIDS.suiteVerificando)).toHaveCount(0, { timeout: 30_000 });
}

/** Exige que la pagina acabe en el panel del dealer: el usuario QA tiene dealer (D1). */
async function exigirPanelDealer(page: Page, desde: string) {
  await expect
    .poll(() => enPanelDealer(new URL(page.url()).pathname), {
      message: `el usuario QA tiene dealer (D1); ${desde} debe redirigir a ${RUTA_DEALER}`,
      timeout: 30_000,
    })
    .toBe(true);
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(150_000);
  // Sin credenciales no hay prueba: fallar, no saltar (un skip saldria verde).
  expect(BASE_URL, "falta BASE_URL").not.toBe("");
  expect(QA_USER, "falta QA_USER").not.toBe("");
  expect(QA_PASSWORD, "falta QA_PASSWORD").not.toBe("");
  page = await iniciarSesion(browser);
});

test.afterAll(async () => await page?.context().close());

test("1. un usuario con dealer nunca ve la Suite operativa", async () => {
  await page.goto(`${BASE_URL}/`);
  await esperarVerificacion(page);
  await page.waitForLoadState("networkidle");
  await exigirPanelDealer(page, "la Suite");
  await expect(page.getByText(SUITE_OPERATIVA, { exact: false })).toHaveCount(0);
  await expect(page.getByText(LEGAL_HUB, { exact: true })).toHaveCount(0);
  console.log(`D2b: usuario QA con dealer -> ${page.url()}`);
});

test("2. Inicio no ensena metricas de plataforma", async () => {
  await page.goto(`${BASE_URL}/`);
  await esperarVerificacion(page);
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId(TESTIDS.metricasPlataforma)).toHaveCount(0);
  await expect(page.getByText(DOMINIOS_CATALOGO)).toHaveCount(0);
});

test("3. ningun enlace lleva a /tenants", async () => {
  await page.goto(`${BASE_URL}/`);
  await esperarVerificacion(page);
  await page.waitForLoadState("networkidle");
  await expect(page.locator(`a[href="${RUTA_TENANTS}"]`)).toHaveCount(0);
});

test("4. /tenants no ensena los tenants inventados", async () => {
  await page.goto(`${BASE_URL}${RUTA_TENANTS}`);
  await esperarVerificacion(page);
  await page.waitForLoadState("networkidle");
  for (const nombre of TENANTS_INVENTADOS) {
    await expect(page.getByText(nombre, { exact: true })).toHaveCount(0);
  }
  await expect(page.getByTestId(TESTIDS.tenantsVerificando)).toHaveCount(0, { timeout: 30_000 });
  await exigirPanelDealer(page, RUTA_TENANTS);
  for (const nombre of TENANTS_INVENTADOS) {
    await expect(page.getByText(nombre, { exact: true })).toHaveCount(0);
  }
});

test("RESULT", async () => {
  console.log("RESULT_D2b=PASS");
});
