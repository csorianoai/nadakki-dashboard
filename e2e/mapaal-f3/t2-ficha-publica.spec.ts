import { expect, test } from "@playwright/test";

/**
 * T2-MKT-SIN-FALSOS: listado y ficha publica de /autos/vehiculos.
 * Publico (sin sesion); tenant por E2E_TENANT_SLUG (por defecto mapaal).
 * Ultima linea del resultado: RESULT_MF3_T2=PASS
 */
const BASE_URL = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/$/, "");
test.use({ baseURL: BASE_URL || undefined });
const TENANT = process.env.E2E_TENANT_SLUG || "mapaal";
// ARS con locale es-AR => "$ 1.500.000"; sin locale => "1.500.000 ARS".
const MONEDA = /(\$\s?\d|\d\s?ARS\b)/;
const PROHIBIDO = [/RD\s?\$/, /US\$/, /\b809-555/, /\bventas\)/, /reseñas/, /\bchasis\b/i, /\bVIN\b/, /n[uú]mero de motor/i];

test.beforeEach(async ({ page }) => {
  await page.addInitScript((t) => window.localStorage.setItem("nadakki_tenant_id", t), TENANT);
});

test("listado y ficha: moneda del tenant, sin datos inventados, mismo vehiculo", async ({ page }) => {
  await page.goto("/autos/vehiculos?view=list");
  const card = page.locator("[data-vehicle-id]").first();
  await expect(card).toBeVisible({ timeout: 30_000 });

  const listText = (await page.locator("main, body").first().innerText()) ?? "";
  for (const re of PROHIBIDO) expect(listText).not.toMatch(re);
  await expect(card).toContainText(MONEDA);

  const titulo = (await card.locator("h3").first().innerText()).trim();
  const link = card.getByRole("link", { name: /ver detalles|ver/i }).first();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/autos\/vehiculo\/[^/?]+/);
  await link.click();

  await expect(page.locator("h1")).toHaveText(titulo, { timeout: 30_000 });
  const fichaText = await page.locator("body").innerText();
  for (const re of PROHIBIDO) expect(fichaText).not.toMatch(re);
  await expect(page.getByText(MONEDA).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /ver número/i })).toHaveCount(0);
  // Sin navegacion ni "similares" sembrados: ningun enlace de la ficha lleva a un vehiculo que no es del tenant.
  await expect(page.getByRole("heading", { name: /vehículos similares/i })).toHaveCount(0);
  await expect(page.locator("[data-vehicle-id]")).toHaveCount(0);

  console.log("RESULT_MF3_T2=PASS");
});
