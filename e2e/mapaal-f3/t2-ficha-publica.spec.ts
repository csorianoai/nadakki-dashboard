import { expect, test, type Page } from "@playwright/test";

/**
 * T2-MKT-SIN-FALSOS: listado y ficha publica de /autos/vehiculos.
 * Publico (sin sesion). TODA llamada al backend se intercepta con datos fijos del tenant QA
 * (page.route); la red hacia api.nadakki.com esta prohibida y un test lo comprueba.
 * Ultima linea del resultado: RESULT_MF3_T2=PASS
 */
const BASE_URL = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/$/, "");
test.use({ baseURL: BASE_URL || undefined });
const TENANT = "mapaal";
// ARS con locale es-AR => "$ 1.500.000"; sin locale => "1.500.000 ARS".
const MONEDA = /(\$\s?1\.500\.000|1\.500\.000\s?ARS\b)/;
const PROHIBIDO = [/RD\s?\$/, /US\$/, /\b809-555/, /\bventas\)/, /reseñas/, /\bchasis\b/i, /\bVIN\b/, /n[uú]mero de motor/i];

// Fixtures fijas del tenant QA: sin dealer, valoraciones ni telefono.
const VEHICULO = {
  id: "7c1f3a52-9d0e-4b8a-a1c4-2e5d6f708192",
  tenant_id: "mapaal",
  make: "Toyota",
  model: "Hilux",
  year: 2021,
  price_rd: 1500000,
  province: "Mendoza",
  body_type: "SUV",
  mileage_km: 42000,
  transmission: "Manual",
  fuel_type: "Diesel",
  condition: "used",
};
const BRANDING = { tenant_id: "mapaal", locale: "es-AR", currency: "ARS" };

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

type Red = { apiNadakki: string[]; sinMock: string[] };

async function interceptarBackend(page: Page): Promise<Red> {
  const red: Red = { apiNadakki: [], sinMock: [] };
  page.on("request", (r) => {
    if (/(^|\/\/)api\.nadakki\.com/i.test(r.url())) red.apiNadakki.push(r.url());
  });
  await page.route(/api\.nadakki\.com/i, (route) => route.abort());
  // Cualquier otra llamada /api/ sin fixture: 404 (y queda anotada).
  await page.route("**/api/**", (route) => {
    red.sinMock.push(route.request().url());
    return route.fulfill(json({ detail: "sin fixture" }, 404));
  });
  await page.route("**/api/v2/tenants/*/branding", (route) => route.fulfill(json(BRANDING)));
  await page.route("**/api/v1/autos/vehicles/search/facets*", (route) =>
    route.fulfill(json({ facets: {} })),
  );
  await page.route("**/api/v1/autos/vehicles/search", (route) =>
    route.fulfill(json({ vehicles: [VEHICULO], total: 1 })),
  );
  await page.route(`**/api/v1/autos/vehicles/${VEHICULO.id}`, (route) => route.fulfill(json(VEHICULO)));
  return red;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((t) => window.localStorage.setItem("nadakki_tenant_id", t), TENANT);
});

test("listado y ficha: moneda del tenant, sin datos inventados, mismo vehiculo", async ({ page }) => {
  const red = await interceptarBackend(page);
  await page.goto("/autos/vehiculos?view=list");
  const card = page.locator("[data-vehicle-id]").first();
  await expect(card).toBeVisible({ timeout: 30_000 });

  const listText = (await page.locator("main, body").first().innerText()) ?? "";
  for (const re of PROHIBIDO) expect(listText).not.toMatch(re);
  await expect(card).toContainText(MONEDA);

  const titulo = (await card.locator("h3").first().innerText()).trim();
  expect(titulo).toContain("Hilux");
  const link = card.getByRole("link", { name: /ver detalles|ver/i }).first();
  const href = await link.getAttribute("href");
  expect(href).toContain(`/autos/vehiculo/${VEHICULO.id}`);
  await link.click();

  await expect(page).toHaveURL(new RegExp(`/autos/vehiculo/${VEHICULO.id}`));
  await expect(page.locator("h1")).toHaveText(titulo, { timeout: 30_000 });
  const fichaText = await page.locator("body").innerText();
  for (const re of PROHIBIDO) expect(fichaText).not.toMatch(re);
  await expect(page.getByText(MONEDA).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /ver número/i })).toHaveCount(0);
  // Sin navegacion ni "similares" sembrados: ningun enlace de la ficha lleva a un vehiculo que no es del tenant.
  await expect(page.getByRole("heading", { name: /vehículos similares/i })).toHaveCount(0);
  await expect(page.locator("[data-vehicle-id]")).toHaveCount(0);

  // Prohibida la red hacia api.nadakki.com: ninguna peticion salio hacia alli.
  expect(red.apiNadakki).toEqual([]);
});

test("sin red hacia api.nadakki.com: todo el backend esta interceptado", async ({ page }) => {
  const red = await interceptarBackend(page);
  await page.goto("/autos/vehiculos?view=list");
  await expect(page.locator("[data-vehicle-id]").first()).toBeVisible({ timeout: 30_000 });
  await page.goto(`/autos/vehiculo/${VEHICULO.id}`);
  await expect(page.locator("h1")).toBeVisible({ timeout: 30_000 });
  expect(red.apiNadakki).toHaveLength(0);

  console.log("RESULT_MF3_T2=PASS");
});
