import { expect, test, type Page } from "@playwright/test";
import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

const OUT = process.env.OUT ?? "/tmp/kit-harness";

const CASOS = [
  { viewport: "1440x900", width: 1440, height: 900, html: "tabla-escritorio.html", movil: false },
  { viewport: "390x844", width: 390, height: 844, html: "tabla-movil.html", movil: true },
  { viewport: "390x844", width: 390, height: 844, html: "seccion-movil-resumen.html", movil: true },
  { viewport: "320x568", width: 320, height: 568, html: "tabla-movil.html", movil: true },
  { viewport: "320x568", width: 320, height: 568, html: "seccion-movil-resumen.html", movil: true },
] as const;

test.skip(!existsSync(join(OUT, "tabla-escritorio.html")), `falta el harness (${OUT}); ejecuta e2e/analytics/build-harness.sh`);

async function abrir(page: Page, html: string, w: number, h: number) {
  const errores: string[] = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(String(e)));
  await page.setViewportSize({ width: w, height: h });
  await page.goto(pathToFileURL(join(OUT, html)).href);
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  return errores;
}

for (const c of CASOS) {
  test(`${c.html} a ${c.viewport}: sin desbordes ni errores, estructura segun el ancho`, async ({ page }, testInfo) => {
    const errores = await abrir(page, c.html, c.width, c.height);
    await expect(page.getByTestId("banner-prototipo")).toBeVisible();

    const ancho = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(ancho.scroll, `desborde horizontal a ${c.viewport}`).toBeLessThanOrEqual(ancho.client);

    // Ningun bloque de contenido se sale del viewport (nada recortado).
    const fuera = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("li, [role=group], [role=tabpanel], table, nav, label, button")).filter(
        (el) => el.getBoundingClientRect().right > window.innerWidth + 0.5
      ).length
    );
    expect(fuera).toBe(0);

    if (c.html === "tabla-escritorio.html") {
      await expect(page.getByRole("table", { name: "Campañas" })).toBeVisible();
      await expect(page.getByRole("tablist")).toHaveCount(0);
    } else {
      await expect(page.getByRole("table")).toHaveCount(0);
      await expect(page.getByRole("tablist")).toBeVisible();
      if (c.html === "tabla-movil.html") {
        await expect(page.getByRole("list", { name: "Campañas" })).toBeVisible();
        // Controles tactiles >= 44 px de alto.
        for (const nombre of [/siguiente/i, /anterior/i, /dirección del orden/i]) {
          const caja = await page.getByRole("button", { name: nombre }).boundingBox();
          expect(caja?.height ?? 0, `alto tactil de ${nombre}`).toBeGreaterThanOrEqual(43.5);
        }
      } else {
        // Tarjetas KPI apiladas: una sola columna (mismo x izquierdo).
        const izquierdos = await page.$$eval("[role=tabpanel] [role=group]", (els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
        expect(izquierdos.length).toBeGreaterThan(1);
        expect(new Set(izquierdos).size).toBe(1);
      }
    }

    const ruta = testInfo.outputPath(`${c.html.replace(".html", "")}-${c.viewport}.png`);
    await page.screenshot({ path: ruta, fullPage: true, animations: "disabled" });
    const hash = createHash("sha256").update(readFileSync(ruta)).digest("hex").slice(0, 16);
    testInfo.annotations.push({ type: "captura-evidencia", description: `${c.html} ${c.viewport} sha256:${hash}` });
    console.log(`CAPTURA ${c.html} ${c.viewport} sha256:${hash}`);
    expect(errores).toEqual([]);
  });
}

test("teclado real: Tab llega a un boton de orden de encabezado y este muestra anillo de foco visible", async ({ page }) => {
  const errores = await abrir(page, "tabla-escritorio.html", 1440, 900);
  const enBotonDeOrden = () => page.evaluate(() => document.activeElement?.tagName === "BUTTON" && !!document.activeElement.closest("th"));
  let llego = false;
  for (let i = 0; i < 30 && !llego; i++) {
    await page.keyboard.press("Tab");
    llego = await enBotonDeOrden();
  }
  expect(llego, "Tab no llego a un boton de encabezado").toBe(true);
  const anillo = await page.evaluate(() => {
    const cs = getComputedStyle(document.activeElement as Element);
    return { estilo: cs.outlineStyle, ancho: parseFloat(cs.outlineWidth) };
  });
  expect(anillo.estilo).not.toBe("none");
  expect(anillo.ancho).toBeGreaterThan(0);
  expect(errores).toEqual([]);
});
