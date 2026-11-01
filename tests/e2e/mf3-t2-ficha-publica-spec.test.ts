/**
 * MF3-T2 — guarda estatica del spec de Playwright e2e/mapaal-f3/t2-ficha-publica.spec.ts.
 * El spec real lo ejecuta la evidencia (necesita navegador); aqui se comprueba, sin navegador, que conserva el
 * contrato: backend interceptado, ninguna red hacia api.nadakki.com, textos inventados prohibidos y estabilidad
 * del segundo goto con `next dev` (esperar a que la red se aquiete).
 */
import * as fs from "fs";
import * as path from "path";

const SPEC = fs.readFileSync(path.join(process.cwd(), "e2e", "mapaal-f3", "t2-ficha-publica.spec.ts"), "utf8");

describe("MF3-T2 spec de ficha publica", () => {
  it("intercepta el backend y comprueba que no sale red hacia api.nadakki.com", () => {
    expect(SPEC).toContain("page.route");
    expect(SPEC).toContain("expect(red.apiNadakki).toEqual([])");
  });

  it("prohibe moneda escrita a mano, vendedor/valoraciones/telefono inventados y chasis/VIN/motor", () => {
    for (const fragmento of ["RD\\s?\\$", "809-555", "reseñas", "chasis", "VIN", "motor"]) {
      expect(SPEC).toContain(fragmento);
    }
  });

  it("espera a que la red se aquiete antes de la ficha directa (next dev aborta el goto en vuelo)", () => {
    const espera = SPEC.indexOf('waitForLoadState("networkidle")');
    const gotoFicha = SPEC.indexOf("await page.goto(`/autos/vehiculo/${VEHICULO.id}`)");
    expect(espera).toBeGreaterThan(-1);
    expect(gotoFicha).toBeGreaterThan(espera);
  });

  it("emite la linea de resultado", () => {
    expect(SPEC).toContain("RESULT_MF3_T2=PASS");
  });
});
