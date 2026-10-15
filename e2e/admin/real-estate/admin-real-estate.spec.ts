import { test, expect, type Page } from "@playwright/test";

const B = "http://backend.invalid";
const CON_DEMO = "http://127.0.0.1:3102";
const SIN_DEMO = "http://127.0.0.1:3103";

type Opc = { acceso: number; roles?: unknown; perfil?: number };

/** Sesión de superadmin de plataforma (guarda de /admin) y respuestas simuladas de /acceso y del perfil. */
async function sesion(page: Page, { acceso, roles = ["tenant_admin"], perfil = 200 }: Opc) {
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/**`, (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/api/v2/auth/refresh`, (route) =>
    route.fulfill({ json: { access_token: "a.b.c", refresh_token: "r", expires_in: 3600 } }));
  const tenant = { id: "t1", slug: "qa", display_name: "QA", subscribed_cores: ["real_estate"] };
  await page.route(`${B}/api/v2/auth/me`, (route) =>
    route.fulfill({ json: {
      user: { id: "u1", email: "qa@nadakki.test", name: "QA", is_active: true, mfa_enabled: false },
      current_tenant: tenant, all_tenants: [tenant],
      active_roles: [{ core_name: "platform", role_key: "platform_superadmin" }],
    } }));
  await page.route(/\/api\/v1\/realestate\/acceso/, (route) =>
    route.fulfill({ status: acceso, json: acceso === 200 ? { roles } : { detail: "denegado" } }));
  await page.route(/\/api\/v1\/realestate\/alta\/tenant\/profile/, (route) =>
    route.fulfill({ status: perfil, json: perfil === 200 ? { jurisdiction_code: "US-FL" } : { detail: "x" } }));
  await page.addInitScript(() => localStorage.setItem("nadakki_refresh_token_v2", "r"));
}

test("con acceso: enlaces a alta y web del agente, jurisdicción real y solo lectura", async ({ page }) => {
  await sesion(page, { acceso: 200 });
  await page.goto(`${CON_DEMO}/admin/real-estate`);
  await expect(page.getByTestId("admin-real-estate")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("tarjeta-alta")).toHaveAttribute("href", "/realtor/alta");
  await expect(page.getByTestId("tarjeta-web")).toHaveAttribute("href", "/realtor/agente-web");
  await expect(page.getByTestId("lista-jurisdicciones")).toContainText("US-FL");
  await expect(page.getByTestId("badge-demo")).toHaveCount(0);
  await expect(page.getByTestId("estado-solo-lectura")).toBeVisible();
});

test("DEMO: sin perfil real, datos de muestra rotulados", async ({ page }) => {
  await sesion(page, { acceso: 200, perfil: 404 });
  await page.goto(`${CON_DEMO}/admin/real-estate`);
  await expect(page.getByTestId("badge-demo")).toHaveText("DEMO · datos sintéticos", { timeout: 30_000 });
});

test("sin datos: 'Sin datos todavía' (build sin DEMO)", async ({ page }) => {
  await sesion(page, { acceso: 200, perfil: 503 });
  await page.goto(`${SIN_DEMO}/admin/real-estate`);
  await expect(page.getByTestId("sin-datos")).toHaveText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("badge-demo")).toHaveCount(0);
});

for (const estado of [401, 403]) {
  test(`${estado}: no se ve configuración alguna`, async ({ page }) => {
    await sesion(page, { acceso: estado });
    await page.goto(`${CON_DEMO}/admin/real-estate`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await expect(page.getByTestId("admin-real-estate")).toHaveCount(0);
    await expect(page.getByText("Jurisdicciones de la licencia")).toHaveCount(0);
    await expect(page.getByText("US-FL")).toHaveCount(0);
  });
}

test("200 sin rol de administración: no se ve configuración", async ({ page }) => {
  await sesion(page, { acceso: 200, roles: ["viewer"] });
  await page.goto(`${CON_DEMO}/admin/real-estate`);
  await page.waitForTimeout(1500);
  await expect(page.getByTestId("admin-real-estate")).toHaveCount(0);
});

let fallos = 0;
test.afterEach(({}, info) => {
  if (info.status !== info.expectedStatus) fallos++;
});
test.afterAll(() => {
  if (fallos === 0) console.log("RESULT_O3_D_ADMIN_REAL_ESTATE=PASS");
});
