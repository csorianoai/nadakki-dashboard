/**
 * D2b — la Suite no muestra la plataforma a usuarios de tenant.
 *
 * Corre SOLO contra el tenant QA, con `QA_USER` / `QA_PASSWORD` (y
 * `QA_TENANT_SLUG` si el host no fija el tenant). Nunca con credenciales de
 * usuarios reales de Mapaal. El login de la app no tiene paso MFA, asi que
 * `QA_TOTP_SECRET` no se usa.
 *
 * Guion:
 *   1. Inicia sesion. Si el usuario tiene dealer, la Suite redirige a
 *      /autos/dealer y la barra "Suite operativa" no aparece nunca.
 *   2. En Inicio no estan las metricas de plataforma.
 *   3. Ningun enlace lleva a /tenants ("Cambiar tenant" ya no apunta ahi).
 *   4. /tenants no ensena los tenants inventados.
 *
 * Ejecutar: BASE_URL=... QA_USER=... QA_PASSWORD=... \
 *   npx playwright test e2e/mapaal/D2b.spec.ts
 */
import { expect, test, type Page } from "@playwright/test";
import {
  DOMINIOS_CATALOGO, LEGAL_HUB, RUTA_TENANTS, SUITE_OPERATIVA, TENANT_QA, TENANTS_INVENTADOS, TESTIDS,
  enPanelDealer,
} from "./d2b-guion";

const BASE_URL = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "";
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";
const QA_TENANT_SLUG = process.env.QA_TENANT_SLUG;

test.describe.configure({ mode: "serial" });

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[type="email"]').fill(QA_USER);
  await page.locator('input[type="password"]').fill(QA_PASSWORD);
  const tenantInput = page.getByPlaceholder("tu-institucion");
  if (QA_TENANT_SLUG && (await tenantInput.count()) > 0) await tenantInput.fill(QA_TENANT_SLUG);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 60_000 });
  const tenant = await page.evaluate(() => window.localStorage.getItem("nadakki_tenant_id"));
  expect(tenant, "la sesion debe ser del tenant QA; con otro tenant el test no sigue").toBe(TENANT_QA);
}

/** Espera a que el gate de la Suite termine de verificar. */
async function esperarVerificacion(page: Page) {
  await expect(page.getByTestId(TESTIDS.suiteVerificando)).toHaveCount(0, { timeout: 30_000 });
}

let esDealer = false;

test.beforeEach(async ({ page }) => {
  // Sin credenciales no hay prueba: fallar, no saltar (un skip saldria verde).
  expect(BASE_URL, "falta BASE_URL").not.toBe("");
  expect(QA_USER, "falta QA_USER").not.toBe("");
  expect(QA_PASSWORD, "falta QA_PASSWORD").not.toBe("");
  await login(page);
});

test("1. un usuario con dealer nunca ve la Suite operativa", async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  await esperarVerificacion(page);
  await page.waitForLoadState("networkidle");
  esDealer = enPanelDealer(new URL(page.url()).pathname);
  if (esDealer) {
    await expect(page.getByText(SUITE_OPERATIVA, { exact: false })).toHaveCount(0);
    await expect(page.getByText(LEGAL_HUB, { exact: true })).toHaveCount(0);
  }
  console.log(`D2b: usuario QA ${esDealer ? "con" : "sin"} dealer -> ${page.url()}`);
});

test("2. Inicio no ensena metricas de plataforma", async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  await esperarVerificacion(page);
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId(TESTIDS.metricasPlataforma)).toHaveCount(0);
  await expect(page.getByText(DOMINIOS_CATALOGO)).toHaveCount(0);
});

test("3. ningun enlace lleva a /tenants", async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  await esperarVerificacion(page);
  await page.waitForLoadState("networkidle");
  await expect(page.locator(`a[href="${RUTA_TENANTS}"]`)).toHaveCount(0);
});

test("4. /tenants no ensena los tenants inventados", async ({ page }) => {
  await page.goto(`${BASE_URL}${RUTA_TENANTS}`);
  await esperarVerificacion(page);
  await page.waitForLoadState("networkidle");
  for (const nombre of TENANTS_INVENTADOS) {
    await expect(page.getByText(nombre, { exact: true })).toHaveCount(0);
  }
  await expect(page.getByTestId(TESTIDS.tenantsVerificando)).toHaveCount(0, { timeout: 30_000 });
  if (!enPanelDealer(new URL(page.url()).pathname))
    await expect(page.getByTestId(TESTIDS.tenantsSoloPlataforma)).toBeVisible();
});

test("RESULT", async () => {
  console.log("RESULT_D2b=PASS");
});
