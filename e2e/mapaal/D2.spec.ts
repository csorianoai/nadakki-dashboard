/**
 * D2 — el menu del dealer dice si no se pudieron verificar los accesos.
 *
 * Corre SOLO contra el tenant QA, con `QA_USER` / `QA_PASSWORD`. Nunca con
 * credenciales de usuarios reales de Mapaal. El login de la app no tiene paso
 * MFA, asi que `QA_TOTP_SECRET` no se usa. Si BASE_URL es el subdominio de otro
 * dealer (`mapaal.nadakki.com`), solo el login va por el host universal (ver
 * `iniciarSesion`); el menu se verifica en BASE_URL.
 *
 * El caso que se fija es el de produccion: el batch de entitlements responde 200
 * con las capabilities denegadas por `no_organization_unit`. Para que no dependa
 * de que el backend QA tenga o no la unidad organizativa, se toma la respuesta
 * REAL del batch y se reescriben sus items a esa denegacion. Las claves son las
 * que pide la app; solo cambia el veredicto.
 *
 * Guion:
 *   1. Barra ancha: el aviso "No se pudieron verificar tus accesos" esta dentro
 *      de la barra del dealer y no hay ningun enlace de modulo.
 *   2. Barra estrecha: tras contraerla, el aviso sigue ahi, con la frase en el
 *      tooltip y sin desbordar los 72 px; sigue sin enlaces de modulo.
 *
 * Depende de D2 parte 1/2 (el aviso en DealerSidebar): contra un despliegue
 * sin ella, los tests 1 y 2 fallan por falta de `dealer-acceso-no-verificado`.
 *
 * Ejecutar: BASE_URL=... QA_USER=... QA_PASSWORD=... \
 *   npx playwright test e2e/mapaal/D2.spec.ts
 */
import { expect, test, type Browser, type Page } from "@playwright/test";

import { resolveDealerAdminHost } from "../../lib/dealer-management/admin-host";
import {
  AVISO,
  MODULOS,
  PLACEHOLDER_TENANT,
  REASON,
  RUTA_BATCH,
  RUTA_PANEL,
  TENANT_QA,
  TESTIDS,
  denegarCuerpo,
} from "./d2-guion";
import { SLUG_QA, huellaDespliegue, origenDeLogin } from "./d9-guion";

const BASE_URL = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";
const VIEWPORT = { width: 1440, height: 900 };

// Cada test entra de cero; el login en produccion tarda mas que los 30 s por defecto.
test.describe.configure({ mode: "serial", timeout: 120_000 });
test.skip(!BASE_URL || !QA_USER || !QA_PASSWORD, "Faltan BASE_URL, QA_USER o QA_PASSWORD");

/**
 * Login del usuario QA y una pagina de BASE_URL con su sesion (sin navegar aun).
 *
 * En `mapaal.nadakki.com` el login fija el tenant `mapaal` y el usuario QA
 * (tenant `mapaal-qa`) recibe 401 "Credenciales invalidas". Entonces el login va
 * por el host universal --tras comprobar que sirve el mismo despliegue-- con el
 * tenant QA escrito, y la sesion (localStorage) se lleva a BASE_URL. Fuera del
 * login nada mira el host. Mismo enfoque que D9 (#600).
 */
async function iniciarSesion(browser: Browser): Promise<Page> {
  const host = resolveDealerAdminHost(new URL(BASE_URL).hostname);
  const origenLogin = origenDeLogin(BASE_URL, host);
  const ctxLogin = await browser.newContext({ viewport: VIEWPORT });

  if (origenLogin !== BASE_URL) {
    const huellas = await Promise.all(
      [BASE_URL, origenLogin].map(async (o) => huellaDespliegue(await (await ctxLogin.request.get(`${o}/login`)).text())),
    );
    console.log(`D2 login: ${BASE_URL} no admite el tenant ${SLUG_QA}; login por ${origenLogin}`);
    expect(huellas[0], `sin huella de despliegue en ${BASE_URL}/login`).not.toBeNull();
    expect(huellas[1], `${origenLogin} no sirve el mismo despliegue que ${BASE_URL}`).toBe(huellas[0]);
  }

  const login = await ctxLogin.newPage();
  await login.goto(`${origenLogin}/login`);
  await login.locator('input[type="email"]').fill(QA_USER);
  await login.locator('input[type="password"]').fill(QA_PASSWORD);
  // Solo hay campo de tenant fuera de un subdominio de dealer. `exact`: el
  // placeholder del email ("admin@tu-institucion.com") tambien casa (#599).
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
    viewport: VIEWPORT,
    storageState: { cookies: [], origins: [{ origin: new URL(BASE_URL).origin, localStorage: deLogin!.localStorage }] },
  });
  return ctx.newPage();
}

/** El batch real, con cada item denegado por `no_organization_unit`. */
async function denegarBatch(page: Page) {
  await page.route(RUTA_BATCH, async (route) => {
    let real: Record<string, unknown> = {};
    try {
      const respuesta = await route.fetch();
      if (respuesta.ok()) real = (await respuesta.json()) as Record<string, unknown>;
    } catch {
      real = {};
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(denegarCuerpo(route.request().url(), real)),
    });
  });
}

async function abrirPanel(page: Page) {
  await denegarBatch(page);
  await page.goto(`${BASE_URL}${RUTA_PANEL}`);
  await expect(page, "la sesion no paso a BASE_URL").toHaveURL((url) => url.pathname === RUTA_PANEL, {
    timeout: 45_000,
  });
  const barra = page.getByTestId(TESTIDS.barra);
  await expect(barra).toBeVisible({ timeout: 30_000 });
  return barra;
}

async function sinModulos(page: Page) {
  const barra = page.getByTestId(TESTIDS.barra);
  for (const href of MODULOS) {
    await expect(barra.locator(`a[href="${href}"]`)).toHaveCount(0);
  }
}

let page: Page;

test.beforeEach(async ({ browser }) => {
  page = await iniciarSesion(browser);
});

test.afterEach(async () => {
  await page?.context().close();
});

test("1. barra ancha: el aviso esta en el menu y no hay modulos", async () => {
  const barra = await abrirPanel(page);
  await expect(barra).toHaveAttribute("data-collapsed", "false");
  const aviso = barra.getByTestId(TESTIDS.aviso);
  await expect(aviso).toBeVisible({ timeout: 30_000 });
  await expect(aviso).toContainText(AVISO);
  await expect(aviso).toHaveAttribute("data-reason-code", REASON);
  await expect(aviso).toHaveAttribute("role", "alert");
  await sinModulos(page);
});

test("2. barra estrecha: el aviso sigue, en tooltip y sin desbordar", async () => {
  const barra = await abrirPanel(page);
  await expect(barra.getByTestId(TESTIDS.aviso)).toBeVisible({ timeout: 30_000 });
  await page.getByTestId(TESTIDS.toggle).click();
  await expect(barra).toHaveAttribute("data-collapsed", "true");
  const aviso = barra.getByTestId(TESTIDS.aviso);
  await expect(aviso).toBeVisible();
  await expect(aviso).toContainText(AVISO);
  await expect(aviso).toHaveAttribute("title", AVISO);
  const cajaBarra = await barra.boundingBox();
  const cajaAviso = await aviso.boundingBox();
  expect(cajaBarra).not.toBeNull();
  expect(cajaAviso).not.toBeNull();
  expect(cajaAviso!.x).toBeGreaterThanOrEqual(cajaBarra!.x);
  expect(cajaAviso!.x + cajaAviso!.width).toBeLessThanOrEqual(cajaBarra!.x + cajaBarra!.width);
  await sinModulos(page);
});

test("RESULT", async () => {
  console.log("RESULT_D2=PASS");
});
