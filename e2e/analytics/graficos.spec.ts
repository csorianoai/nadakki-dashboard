import { expect, test } from "@playwright/test";
import { existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

const OUT = process.env.OUT ?? "/tmp/kit-harness";
const VIEWPORTS = [
  { nombre: "1440x900", width: 1440, height: 900 },
  { nombre: "390x844", width: 390, height: 844 },
  { nombre: "320x568", width: 320, height: 568 },
] as const;
const COMPONENTES = ["c-serie", "c-serie-corta", "c-barras-h", "c-barras-v", "c-donut", "c-embudo", "c-dispersion", "c-estados"] as const;

for (const v of VIEWPORTS) {
  const html = join(OUT, `graficos-${v.nombre}.html`);
  test.describe(`graficos ${v.nombre}`, () => {
    test.skip(!existsSync(html), `falta el harness (${html}); ejecuta e2e/analytics/build-harness.sh`);

    test("sin desbordes horizontales, sin textos fuera del viewport, sin errores de consola, marca de prototipo visible", async ({ page }, testInfo) => {
      const errores: string[] = [];
      page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
      page.on("pageerror", (e) => errores.push(String(e)));
      await page.setViewportSize({ width: v.width, height: v.height });
      await page.goto(pathToFileURL(html).href);
      await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });

      await expect(page.getByTestId("banner-prototipo")).toBeVisible();
      const ancho = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      expect(ancho.scroll, `desborde horizontal a ${v.nombre}`).toBeLessThanOrEqual(ancho.client);

      for (const id of COMPONENTES) {
        const el = page.getByTestId(id);
        await expect(el).toBeVisible();
        const caja = await el.boundingBox();
        expect(caja, id).not.toBeNull();
        expect((caja?.x ?? 0) + (caja?.width ?? 0), `${id} sale del viewport a ${v.nombre}`).toBeLessThanOrEqual(v.width + 0.5);
        // Ningun texto del SVG queda fuera de su propio svg (recortado por el viewBox).
        const recortados = await el.evaluate((root) => {
          let n = 0;
          root.querySelectorAll("svg").forEach((svg) => {
            const r = svg.getBoundingClientRect();
            svg.querySelectorAll("text").forEach((t) => {
              const b = t.getBoundingClientRect();
              if (b.width > 0 && (b.left < r.left - 1 || b.right > r.right + 1 || b.top < r.top - 1 || b.bottom > r.bottom + 1)) n += 1;
            });
          });
          return n;
        });
        expect(recortados, `${id}: textos SVG recortados a ${v.nombre}`).toBe(0);
        await el.screenshot({ path: testInfo.outputPath(`${id}-${v.nombre}.png`), animations: "disabled" });
      }
      await page.screenshot({ path: testInfo.outputPath(`graficos-${v.nombre}.png`), fullPage: true, animations: "disabled" });
      expect(errores).toEqual([]);
    });
  });
}
