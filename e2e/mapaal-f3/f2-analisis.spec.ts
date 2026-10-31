/**
 * F2 — Analisis de Costos y Analisis de Gastos: el total mostrado es el `total` del endpoint de F1 y cada barra enlaza
 * al detalle (o filtra).
 *
 * Corre en CI contra el servidor local (`next start`, baseURL de playwright) SIN credenciales ni red externa: TODA
 * llamada al backend se intercepta con `page.route` y datos fijos del tenant QA con la forma del endpoint de F1. El cuadre
 * de totales contra F1 real lo prueba el test de contrato del backend. Una peticion a api.nadakki.com (o a cualquier
 * origen que no sea el servidor local) hace fallar el test.
 *
 *   npx playwright test e2e/mapaal-f3/f2-analisis.spec.ts --reporter=line
 */
import { expect, test, type Page } from "@playwright/test";

const RUTAS = {
  costos: { pantalla: "/autos/dealer/finanzas/analisis-costos", api: "/api/v1/contable/reports/costos-por-vehiculo-tipo-mes" },
  gastos: { pantalla: "/autos/dealer/finanzas/analisis-gastos", api: "/api/v1/contable/reports/gastos-por-cuenta-mes" },
};

// Datos fijos del tenant QA (forma de F1). `total` de cabecera = suma de filas en la moneda funcional.
const COSTOS = {
  moneda: "DOP",
  total: 150000,
  filas: [
    { vehicle_id: "veh-qa-1", cost_type: "purchase", mes: "2026-08", currency: "DOP", total: 100000 },
    { vehicle_id: "veh-qa-1", cost_type: "repair", mes: "2026-09", currency: "DOP", total: 20000 },
    { vehicle_id: "veh-qa-2", cost_type: "purchase", mes: "2026-09", currency: "DOP", total: 30000 },
  ],
  totales_por_moneda: [{ currency: "DOP", total: 150000 }],
};
const COSTOS_3M = { ...COSTOS, total: 50000, filas: COSTOS.filas.slice(1), totales_por_moneda: [{ currency: "DOP", total: 50000 }] };
const GASTOS = {
  moneda: "DOP",
  total: 9000,
  filas: [
    { mes: "2026-08", codigo: "6010", nombre: "Gastos de oficina", total: 4000 },
    { mes: "2026-09", codigo: "6010", nombre: "Gastos de oficina", total: 3000 },
    { mes: "2026-09", codigo: "6020", nombre: "Publicidad", total: 2000 },
  ],
};
const GASTOS_3M = { ...GASTOS, total: 5000, filas: GASTOS.filas.slice(1) };
const CUERPOS = {
  costos: { todo: COSTOS, "3m": COSTOS_3M },
  gastos: { todo: GASTOS, "3m": GASTOS_3M },
};

async function simularBackend(page: Page, externas: string[]) {
  // Orden: la ultima ruta registrada gana. Primero lo general, al final lo especifico. Lo simulado nunca llega a esta
  // ruta; lo que llega y es de nadakki.com (p. ej. api.nadakki.com) se anota y se aborta: el test falla al final.
  await page.route("**/*", async (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host === "127.0.0.1" || host === "localhost") return route.fallback();
    if (/(^|\.)nadakki\.com$/.test(host)) externas.push(route.request().url());
    return route.abort();
  });
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  const tenant = { id: "t-qa", slug: "mapaal-qa", display_name: "Mapaal QA", subscribed_cores: ["autos", "contable"] };
  await page.route("**/api/v1/autos/me/dealer-context**", (route) =>
    route.fulfill({
      json: { assignments: [{ dealer_id: "dealer-qa", organization_unit_id: "ou-qa", dealer_name: "Mapaal QA" }] },
    }),
  );
  await page.route("**/api/v2/auth/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "u-qa", email: "qa@mapaal-qa.test", name: "QA", is_active: true, mfa_enabled: false },
        current_tenant: tenant,
        all_tenants: [tenant],
        active_roles: [{ core_name: "platform", role_key: "tenant_admin", display_name: "Administrador" }],
      },
    }),
  );
  await page.route("**/api/v2/auth/refresh", (route) =>
    route.fulfill({ json: { access_token: "a.b.c", refresh_token: "r", expires_in: 3600 } }),
  );
  await page.route("**/branding**", (route) =>
    route.fulfill({ json: { display_name: "Mapaal QA", locale: "es-DO", currency: "DOP", timezone: "America/Santo_Domingo" } }),
  );
  await page.route("**/api/v1/access/entitlements/batch**", (route) => {
    const claves = new URL(route.request().url()).searchParams.getAll("capabilities").flatMap((c) => c.split(","));
    const results: Record<string, { allowed: boolean }> = {};
    for (const c of claves) results[c] = { allowed: true };
    return route.fulfill({ json: { results } });
  });
  for (const nombre of ["costos", "gastos"] as const) {
    await page.route(`**${RUTAS[nombre].api}**`, (route) => {
      const u = new URL(route.request().url());
      return route.fulfill({ json: u.searchParams.has("desde") ? CUERPOS[nombre]["3m"] : CUERPOS[nombre].todo });
    });
  }
  await page.addInitScript(() => {
    localStorage.setItem("nadakki_refresh_token_v2", "r");
    localStorage.setItem("nadakki_tenant_id", "t-qa");
    localStorage.setItem("nadakki_dealer_tenant_id", "t-qa");
    localStorage.setItem("nadakki_dealer_id", "dealer-qa");
    localStorage.setItem("nadakki_organization_unit_id", "ou-qa");
  });
}

test("F2: los totales de las dos pantallas son los del endpoint de F1 y las barras enlazan", async ({ page }) => {
  test.setTimeout(240_000);
  const externas: string[] = [];
  await simularBackend(page, externas);

  for (const nombre of ["costos", "gastos"] as const) {
    const ruta = RUTAS[nombre];
    await page.goto(ruta.pantalla);
    const total = page.getByTestId("analisis-total");
    await expect(total).toBeVisible({ timeout: 60_000 });
    await expect(total).toHaveAttribute("data-total", String(CUERPOS[nombre].todo.total));
    await expect(total).toHaveAttribute("data-moneda", "DOP");

    await page.getByTestId("analisis-periodo").selectOption("3m");
    await expect(total).toHaveAttribute("data-total", String(CUERPOS[nombre]["3m"].total), { timeout: 30_000 });
  }

  // Gastos: cada cuenta es un control que filtra el detalle mensual.
  await page.goto(RUTAS.gastos.pantalla);
  await expect(page.getByTestId("analisis-total")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("gastos-cuenta")).toHaveCount(2);
  await page.getByTestId("gastos-cuenta").first().getByRole("button").click();
  await expect(page.getByTestId("gastos-mes")).toHaveCount(2);

  // Costos: la fila de un vehiculo enlaza a su ficha.
  await page.goto(RUTAS.costos.pantalla);
  await expect(page.getByTestId("analisis-total")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("costos-vehiculo")).toHaveCount(2);
  await page.getByTestId("costos-vehiculo").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/autos\/dealer\/inventario\/veh-qa-1/);

  // Prohibida la red hacia api.nadakki.com (y cualquier origen externo).
  expect(externas, "peticiones hacia nadakki.com (prohibidas)").toEqual([]);

  console.log("RESULT_MF3_F2=PASS");
});
