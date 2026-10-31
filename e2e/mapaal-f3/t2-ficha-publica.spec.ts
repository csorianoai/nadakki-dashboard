import { expect, test } from "@playwright/test";

/**
 * T2-MKT-SIN-FALSOS: listado y ficha publica de /autos/vehiculos.
 * Publico (sin sesion); tenant por E2E_TENANT_SLUG (por defecto mapaal).
 * Ultima linea del resultado: RESULT_MF3_T2=PASS
 */
const TENANT = process.env.E2E_TENANT_SLUG || "mapaal";
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
  await expect(card).toContainText(/\$\s?\d/);

  const titulo = (await card.locator("h3").first().innerText()).trim();
  const link = card.getByRole("link", { name: /ver detalles|ver/i }).first();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/autos\/vehiculo\/[^/?]+/);
  await link.click();

  await expect(page.locator("h1")).toHaveText(titulo, { timeout: 30_000 });
  const fichaText = await page.locator("body").innerText();
  for (const re of PROHIBIDO) expect(fichaText).not.toMatch(re);
  await expect(page.getByText(/\$\s?\d/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /ver número/i })).toHaveCount(0);

  console.log("RESULT_MF3_T2=PASS");
});
