import { test, expect, type Page } from "@playwright/test";

/**
 * Centinela de la fase 1 de marketing (Cesar, 2026-11-01): rompe el circulo «la puerta esta roja porque no hay specs».
 * Prueba real y minima: la pantalla /marketing carga con el backend INTERCEPTADO y muestra sus modulos.
 *
 * Hermetico: la sesion y todo `backend.invalid` se simulan aqui; si la pagina pide algo fuera de 127.0.0.1 y de
 * backend.invalid, el test falla (playwright.config.fase1.ts ademas impide que el navegador resuelva otros hosts).
 */
const B = "http://backend.invalid";

async function sesion(page: Page) {
  // El ultimo route registrado gana: primero el generico, despues los de sesion (mismo patron que e2e/visual).
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/**`, (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/api/v2/auth/refresh`, (route) =>
    route.fulfill({ json: { access_token: "a.b.c", refresh_token: "r", expires_in: 3600 } }));
  const tenant = { id: "t1", slug: "qa", display_name: "QA", subscribed_cores: ["credit", "legal", "marketing"] };
  await page.route(`${B}/api/v2/auth/me`, (route) =>
    route.fulfill({ json: {
      user: { id: "u1", email: "qa@nadakki.test", name: "QA", is_active: true, mfa_enabled: false },
      current_tenant: tenant, all_tenants: [tenant],
      active_roles: [{ core_name: "marketing", role_key: "marketing_admin", display_name: "Marketing" }],
    } }));
  await page.addInitScript(() => localStorage.setItem("nadakki_refresh_token_v2", "r"));
}

test("centinela: /marketing carga con el backend interceptado", async ({ page }) => {
  const externas: string[] = [];
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (!["127.0.0.1", "backend.invalid"].includes(u.hostname) && !["data:", "blob:"].includes(u.protocol)) externas.push(req.url());
  });
  await sesion(page);
  await page.goto("/marketing");
  await expect(page.locator('a[href="/marketing/campaigns"]').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('a[href="/marketing/journeys"]').first()).toBeVisible();
  expect(externas, "ninguna peticion puede salir de 127.0.0.1 / backend.invalid").toEqual([]);
});
