import { expect, test } from "@playwright/test";
import { existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

const OUT = process.env.OUT ?? "/tmp/kit-harness";
const HTML = join(OUT, "kit.html");
const VIEWPORTS = [
  { nombre: "1440x900", width: 1440, height: 900 },
  { nombre: "390x844", width: 390, height: 844 },
  { nombre: "320x568", width: 320, height: 568 },
] as const;

test.skip(!existsSync(HTML), `falta el harness (${HTML}); ejecuta e2e/analytics/build-harness.sh`);

for (const v of VIEWPORTS) {
  test(`kit ${v.nombre}: sin desbordes, sin errores de consola, marca de prototipo visible`, async ({ page }, testInfo) => {
    const errores: string[] = [];
    page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
    page.on("pageerror", (e) => errores.push(String(e)));
    await page.setViewportSize({ width: v.width, height: v.height });
    await page.goto(pathToFileURL(HTML).href);
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });

    await expect(page.getByTestId("banner-prototipo")).toBeVisible();
    const ancho = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(ancho.scroll, `desborde horizontal a ${v.nombre}`).toBeLessThanOrEqual(ancho.client);

    // Nada recortado dentro de las tarjetas: ningun elemento de la grilla supera el ancho del viewport.
    const fuera = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[role=group]")).filter((el) => el.getBoundingClientRect().right > window.innerWidth + 0.5).length
    );
    expect(fuera).toBe(0);

    await page.screenshot({ path: testInfo.outputPath(`kit-${v.nombre}.png`), fullPage: true, animations: "disabled" });
    expect(errores).toEqual([]);
  });
}
