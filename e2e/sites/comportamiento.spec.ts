import { test, expect } from "@playwright/test";
import { NODEMO, SITE, sesion } from "./sesion";

test("DEMO: el build con DEMO muestra datos y el badge", async ({ page }) => {
  await sesion(page);
  await page.goto("/mi-web/paginas");
  await expect(page.getByTestId("badge-demo")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/SYNTH/).first()).toBeVisible();
});

test("teclado: Tab recorre skip-link, idioma y navegacion sin trampa de foco", async ({ page }) => {
  await sesion(page);
  await page.goto("/mi-web");
  await expect(page.getByTestId("badge-demo")).toBeVisible({ timeout: 30_000 });
  await page.locator("body").click({ position: { x: 0, y: 0 } });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const vistos: string[] = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    vistos.push(await page.evaluate(() => {
      const e = document.activeElement as HTMLElement | null;
      return e ? `${e.tagName}|${e.getAttribute("href") ?? ""}|${e.id}` : "";
    }));
  }
  const iSkip = vistos.findIndex((v) => v.includes("#contenido"));
  const iLang = vistos.findIndex((v) => v.endsWith("|sx-lang"));
  const iNav = vistos.findIndex((v) => v.includes("/mi-web/vista-previa"));
  expect(iSkip, vistos.join("\n")).toBeGreaterThanOrEqual(0);
  expect(iLang).toBeGreaterThanOrEqual(0);
  expect(iNav).toBeGreaterThanOrEqual(0);
  expect(new Set(vistos).size).toBeGreaterThan(8); // el foco avanza: no queda atrapado en un control
});

test("sin DEMO y con la API caida no hay datos mock: estado UNAVAILABLE", async ({ page }) => {
  await sesion(page, "caida");
  for (const ruta of ["/mi-web", "/mi-web/propiedades", "/mi-web/vista-previa"]) {
    await page.goto(`${NODEMO}${ruta}`);
    await expect(page.getByTestId("estado-unavailable")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("badge-demo")).toHaveCount(0);
    await expect(page.getByText(/SYNTH/)).toHaveCount(0);
  }
});

test("tenant ajeno: 404 NOT_FOUND se muestra como 'no encontrado' sin datos", async ({ page }) => {
  await sesion(page, "ajeno");
  await page.goto(`${NODEMO}/mi-web/vista-previa?sitio=${SITE}`);
  await expect(page.getByTestId("vp-no-encontrado")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("vp-marco")).toHaveCount(0);
  await expect(page.getByText(/SYNTH/)).toHaveCount(0);
});

test("Medios: con los campos de permiso vacios el formulario no se envia", async ({ page }) => {
  const vistas = await sesion(page);
  await page.goto("/mi-web/medios");
  await expect(page.getByTestId("form-medio")).toBeVisible({ timeout: 30_000 });
  const antes = vistas.length;
  await page.getByTestId("enviar").click({ force: true }); // aria-disabled: el clic debe llegar y no enviar
  await expect(page.getByTestId("error-campos")).toBeVisible();
  await expect(page.getByTestId("enviar")).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByTestId("medio-enviado")).toHaveCount(0);
  await expect(page.getByTestId("error-fuente")).toBeVisible();
  expect(vistas.slice(antes).filter((u) => u.includes("/media"))).toHaveLength(0);
});
