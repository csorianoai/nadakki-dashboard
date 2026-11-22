import { expect, test } from "@playwright/test";
import { existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

/**
 * Tema claro/oscuro del kit (evidencia, no baseline): contraste de lo REALMENTE renderizado, objetivos tactiles de 44 px,
 * fondo del tema y formato por tenant. Se ejecuta una vez por tema:
 *   OUT=/tmp/kit-h-claro  TEMA=light npx playwright test -c playwright.config.analytics.ts e2e/analytics/tema.spec.ts
 *   OUT=/tmp/kit-h-oscuro TEMA=dark  npx playwright test -c playwright.config.analytics.ts e2e/analytics/tema.spec.ts
 */
const OUT = process.env.OUT ?? "/tmp/kit-harness";
const TEMA = process.env.TEMA === "dark" ? "dark" : "light";
const FONDO_ESPERADO = TEMA === "dark" ? "rgb(10, 16, 28)" : "rgb(247, 248, 250)";
const PAGINAS = [
  { html: "kit.html", viewport: { width: 1440, height: 900 } },
  { html: "kit.html", viewport: { width: 320, height: 568 } },
  { html: "graficos-1440x900.html", viewport: { width: 1440, height: 900 } },
  { html: "graficos-390x844.html", viewport: { width: 390, height: 844 } },
  { html: "tabla-escritorio.html", viewport: { width: 1440, height: 900 } },
  { html: "tabla-movil.html", viewport: { width: 390, height: 844 } },
  { html: "seccion-movil-resumen.html", viewport: { width: 390, height: 844 } },
] as const;

test.skip(!existsSync(join(OUT, "kit.html")), `falta el harness (${OUT}); ejecuta e2e/analytics/build-harness.sh`);

async function abrir(page: import("@playwright/test").Page, html: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(pathToFileURL(join(OUT, html)).href);
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
}

for (const p of PAGINAS) {
  const nombre = `${p.html} ${p.viewport.width}x${p.viewport.height} (${TEMA})`;

  test(`tema ${nombre}: el tema aplicado es ${TEMA} y el fondo es el del token`, async ({ page }) => {
    await abrir(page, p.html, p.viewport);
    const r = await page.evaluate(() => {
      const raiz = document.querySelector<HTMLElement>(".forge-app") as HTMLElement;
      return { tema: raiz.getAttribute("data-theme"), fondo: getComputedStyle(raiz).backgroundColor };
    });
    expect(r.tema).toBe(TEMA);
    expect(r.fondo).toBe(FONDO_ESPERADO);
  });

  test(`tema ${nombre}: todo el texto renderizado cumple AA (4,5:1; 3:1 en glifos decorativos y botones inactivos)`, async ({ page }, testInfo) => {
    await abrir(page, p.html, p.viewport);
    const informe = await page.evaluate(() => {
      type RGBA = [number, number, number, number];
      const parse = (c: string): RGBA | null => {
        let m = c.match(/^rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?\)$/);
        if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
        m = c.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/);
        if (m) return [+m[1] * 255, +m[2] * 255, +m[3] * 255, m[4] === undefined ? 1 : +m[4]];
        return null;
      };
      const mezcla = (f: RGBA, b: [number, number, number]): [number, number, number] => [f[0] * f[3] + b[0] * (1 - f[3]), f[1] * f[3] + b[1] * (1 - f[3]), f[2] * f[3] + b[2] * (1 - f[3])];
      const fondoEfectivo = (el: Element): [number, number, number] => {
        const cadena: RGBA[] = [];
        for (let e: Element | null = el; e; e = e.parentElement) {
          const c = parse(getComputedStyle(e).backgroundColor);
          if (c && c[3] > 0) cadena.push(c);
          if (c && c[3] >= 1) break;
        }
        let base: [number, number, number] = [255, 255, 255];
        for (const c of cadena.reverse()) base = mezcla(c, base);
        return base;
      };
      const lum = (c: number[]) => {
        const l = c.map((v) => v / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
        return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
      };
      const ratio = (a: number[], b: number[]) => {
        const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
        return (x + 0.05) / (y + 0.05);
      };
      const fallos: string[] = [];
      let revisados = 0;
      let menor = 99;
      for (const el of Array.from(document.body.querySelectorAll("*"))) {
        const propio = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join("").trim();
        if (!propio) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1) continue; // .sr-only
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        const esSvg = el instanceof SVGElement;
        const fg = parse(esSvg ? cs.fill : cs.color);
        if (!fg) continue;
        const bg = fondoEfectivo(el);
        const primer = mezcla(fg, bg);
        const rr = ratio(primer, bg);
        const decorativo = !!el.closest('[aria-hidden="true"]') || !!el.closest("button:disabled");
        const minimo = decorativo ? 3 : 4.5;
        revisados++;
        menor = Math.min(menor, rr);
        if (rr + 0.005 < minimo) fallos.push(`${rr.toFixed(2)}:1 < ${minimo} · «${propio.slice(0, 40)}» <${el.tagName.toLowerCase()} class="${(el.getAttribute("class") ?? "").slice(0, 60)}">`);
      }
      return { revisados, menor: Math.round(menor * 100) / 100, fallos };
    });
    testInfo.annotations.push({ type: "contraste", description: `${informe.revisados} textos revisados; el peor es ${informe.menor}:1` });
    expect(informe.revisados).toBeGreaterThan(5);
    expect(informe.fallos).toEqual([]);
  });
}

test(`objetivos tactiles (${TEMA}): pestañas moviles y botones de cabecera de tabla >= 44 px; el layout no se rompe`, async ({ page }, testInfo) => {
  await abrir(page, "tabla-movil.html", { width: 390, height: 844 });
  const pestanas = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]')).map((e) => Math.round(e.getBoundingClientRect().height * 10) / 10));
  await abrir(page, "seccion-movil-resumen.html", { width: 390, height: 844 });
  const pestanas2 = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]')).map((e) => Math.round(e.getBoundingClientRect().height * 10) / 10));
  await abrir(page, "tabla-escritorio.html", { width: 1440, height: 900 });
  const cabeceras = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("th > button")).map((b) => ({
      boton: Math.round(b.getBoundingClientRect().height * 10) / 10,
      th: Math.round((b.closest("th") as HTMLElement).getBoundingClientRect().height * 10) / 10,
    }))
  );
  const scroll = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  testInfo.annotations.push({ type: "tactil", description: `pestañas ${JSON.stringify([...pestanas, ...pestanas2])}; cabeceras ${JSON.stringify(cabeceras)}` });
  const todas = [...pestanas, ...pestanas2];
  expect(todas.length).toBeGreaterThan(0);
  for (const h of todas) expect(h).toBeGreaterThanOrEqual(44);
  expect(cabeceras.length).toBeGreaterThan(0);
  for (const c of cabeceras) {
    expect(c.boton).toBeGreaterThanOrEqual(44);
    expect(c.th).toBeLessThanOrEqual(64); // la cabecera no crece mas de lo razonable
  }
  expect(scroll.s).toBeLessThanOrEqual(scroll.c);
});

test(`formato por tenant (${TEMA}): Baylara en $12.00 y MAPAAL en $ 1.234,50`, async ({ page }) => {
  await abrir(page, "kit.html", { width: 1440, height: 900 });
  const baylara = ((await page.getByTestId("formato-baylara").textContent()) ?? "").replace(/[\s ]+/g, " ");
  const mapaal = ((await page.getByTestId("formato-mapaal").textContent()) ?? "").replace(/[\s ]+/g, " ");
  expect(baylara).toContain("$12.00");
  expect(baylara).toContain("Nov 10, 2026");
  expect(mapaal).toContain("$ 1.234,50");
  expect(mapaal).toContain("10 de nov de 2026");
});
