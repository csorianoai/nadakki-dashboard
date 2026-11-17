import { test, expect, type Page } from "@playwright/test";
import { sesion } from "../sesion";

/**
 * LAYOUT-RESPONSIVE (auditoría Cowork B2, staging 7dcc6c6): a 511 px Clientes, Operaciones y Documentos mantenían
 * la rejilla de dos columnas, desbordaban y el contenedor con overflow-x:hidden recortaba «Editar contacto» y
 * «Plantillas». En cada ancho: sin scroll horizontal, ningún control visible recortado por un ancestro ni fuera del
 * viewport, y por debajo de los dos mínimos las columnas van una debajo de otra. A 1440 siguen lado a lado.
 */
const PANTALLAS = [
  { ruta: "/realtor/clientes", panel: "clientes-panel", columnas: "clientes-columnas" },
  { ruta: "/realtor/operaciones", panel: "operaciones-panel", columnas: "operaciones-columnas" },
  { ruta: "/realtor/documentos", panel: "documentos-panel", columnas: "documentos-columnas" },
];

/** Controles visibles cuyo rectángulo sale del viewport o de un ancestro que recorta (overflow distinto de visible). */
async function recortados(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const vw = document.documentElement.clientWidth;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("main a, main button, main input, main select, main textarea, [data-testid$='-panel'] a, [data-testid$='-panel'] button"))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === "hidden") continue;
      const nombre = `${el.tagName.toLowerCase()} «${(el.getAttribute("aria-label") || el.textContent || el.getAttribute("data-testid") || "").trim().slice(0, 40)}»`;
      if (r.left < -1 || r.right > vw + 1) { out.push(`${nombre} fuera del viewport (${Math.round(r.left)}..${Math.round(r.right)} de ${vw})`); continue; }
      for (let a = el.parentElement; a; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
        if (cs.overflowX === "auto" || cs.overflowX === "scroll") break; // desplazable a propósito: no recorta
        const ar = a.getBoundingClientRect();
        if (r.left < ar.left - 1 || r.right > ar.right + 1) { out.push(`${nombre} recortado por ${a.tagName.toLowerCase()}.${a.className || a.getAttribute("data-testid") || ""}`); break; }
      }
    }
    return out;
  });
}

for (const ancho of [390, 511, 768, 1024]) {
  for (const p of PANTALLAS) {
    test(`${p.ruta} a ${ancho} px: sin desborde ni controles recortados; columnas apiladas si no caben`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 900 });
      await sesion(page, 200);
      await page.goto(p.ruta);
      await expect(page.getByTestId(p.panel)).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(300);
      // Primero lo que vio la auditoría (no depende de cómo esté hecha la rejilla), después la rejilla.
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      expect(await recortados(page)).toEqual([]);
      const col = page.getByTestId(p.columnas);
      await expect(col).toBeVisible();
      // Ningún hijo de la rejilla más ancho que ella.
      const anchos = await col.evaluate((c) => ({ c: c.getBoundingClientRect().width, hijos: Array.from(c.children).map((h) => h.scrollWidth) }));
      for (const h of anchos.hijos) expect(h).toBeLessThanOrEqual(Math.ceil(anchos.c) + 1);
      if (ancho <= 511) {
        const [a, b] = await col.evaluate((c) => Array.from(c.children).slice(0, 2).map((h) => h.getBoundingClientRect().toJSON()));
        expect(b.top).toBeGreaterThanOrEqual(a.bottom); // una debajo de otra
        expect(Math.abs(a.width - b.width)).toBeLessThanOrEqual(1);
      }
    });
  }
}

test("a 1440 px las dos columnas siguen lado a lado en su proporción (Clientes 4:7)", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/clientes");
  const col = page.getByTestId("clientes-columnas");
  await expect(col).toBeVisible({ timeout: 30_000 });
  const [a, b] = await col.evaluate((c) => Array.from(c.children).slice(0, 2).map((h) => h.getBoundingClientRect().toJSON()));
  expect(Math.abs(a.top - b.top)).toBeLessThanOrEqual(1);
  expect(a.width / b.width).toBeCloseTo(4 / 7, 1);
});
