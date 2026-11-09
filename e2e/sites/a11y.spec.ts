import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { RUTAS, sesion } from "./sesion";

/** El analisis cubre la raiz de Mi web (data-testid="mi-web-raiz"); el marco comun de la plataforma es de otras zonas (ver README.md).
 * axe-core WCAG 2.1 A/AA sobre las 7 pantallas de Mi web, 2 anchos y 2 idiomas: 0 violaciones de CUALQUIER impacto. */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const ANCHOS = [1280, 390] as const;
const IDIOMAS = ["es", "en"] as const;
let fallos = 0;
test.afterEach(({}, info) => void (info.status !== info.expectedStatus && (fallos += 1)));
test.afterAll(() => { console.log(`A11Y_FALLOS=${fallos}`); });

for (const ruta of RUTAS) for (const ancho of ANCHOS) for (const lang of IDIOMAS) {
  test(`axe ${ruta} ${ancho}px ${lang}`, async ({ page }) => {
    await sesion(page);
    await page.setViewportSize({ width: ancho, height: 900 });
    await page.goto(ruta);
    await expect(page.getByTestId("badge-demo")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("navigation", { name: /Secciones|Sections/ })).toBeVisible();
    if (lang === "en") {
      await page.locator("#sx-lang").selectOption("en");
      await expect(page.getByRole("navigation", { name: "Sections" })).toBeVisible();
    }
    await page.waitForLoadState("networkidle");
    const r = await new AxeBuilder({ page }).include('[data-testid="mi-web-raiz"]').withTags(TAGS).analyze();
    // Los incompletos de color-contrast no se ocultan: quedan en el log para revision manual.
    const inc = r.incomplete.filter((v) => v.id === "color-contrast");
    for (const v of inc) console.log(`INCOMPLETO color-contrast ${ruta} ${ancho}px ${lang}: ${v.nodes.length} nodos -> ${v.nodes.slice(0, 5).map((n) => n.target.join(" ")).join(" | ")}`);
    expect(r.violations, JSON.stringify(r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })), null, 2)).toHaveLength(0);
  });
}
