/**
 * MF3-T2 (regresion) — el spec de ficha publica corre contra `next dev` en CI, que compila cada ruta en frio.
 * Medidas anteriores (red quieta antes del goto) no bastaron: el click a la ficha tardaba mas que los 5 s por
 * defecto de toHaveURL y dos workers compilaban a la vez. Guarda estatica (sin navegador) de las medidas estables.
 */
import * as fs from "fs";
import * as path from "path";

const SPEC = fs.readFileSync(path.join(process.cwd(), "e2e", "mapaal-f3", "t2-ficha-publica.spec.ts"), "utf8");

describe("MF3-T2 spec estable con next dev", () => {
  it("corre en serie (sin dos compilaciones en frio simultaneas)", () => {
    expect(SPEC).toContain('test.describe.configure({ mode: "serial" })');
  });

  it("precalienta las rutas del listado y de la ficha antes de los tests", () => {
    expect(SPEC).toContain("test.beforeAll");
    expect(SPEC).toMatch(/request\.get\(/);
  });

  it("el toHaveURL tras el click no usa el timeout por defecto de 5 s", () => {
    const linea = SPEC.split("\n").find((l) => l.includes("toHaveURL")) ?? "";
    expect(linea).toMatch(/NAV|timeout/);
  });

  it("el segundo test tambien espera a que la red se aquiete antes de la ficha directa", () => {
    const segundo = SPEC.slice(SPEC.indexOf("sin red hacia api.nadakki.com: todo el backend"));
    expect(segundo.indexOf('waitForLoadState("networkidle")')).toBeGreaterThan(-1);
    expect(segundo.indexOf('waitForLoadState("networkidle")')).toBeLessThan(segundo.indexOf("await page.goto(`/autos/vehiculo/"));
  });
});
