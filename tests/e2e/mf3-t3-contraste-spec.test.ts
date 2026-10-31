/**
 * MF3-T3 — guarda estatica del spec de Playwright e2e/mapaal-f3/t3-contraste.spec.ts.
 * El spec real lo ejecuta la evidencia (necesita navegador y credenciales QA); aqui se comprueba, sin navegador,
 * que conserva el contrato: 4 pantallas de Contabilidad, tema claro y oscuro, umbral 4.5:1 y la linea de resultado.
 */
import * as fs from "fs";
import * as path from "path";

const SPEC = fs.readFileSync(path.join(process.cwd(), "e2e", "mapaal-f3", "t3-contraste.spec.ts"), "utf8");

describe("MF3-T3 spec de contraste", () => {
  it.each(["/contable/plan-cuentas", "/contable/libro-mayor", "/contable/asientos/nuevo", "/contable/balance"])(
    "cubre la pantalla %s",
    (ruta) => {
      expect(SPEC).toContain(ruta);
    },
  );

  it("mide ambos temas con umbral 4.5:1", () => {
    expect(SPEC).toMatch(/\["light",\s*"dark"\]/);
    expect(SPEC).toContain("ratio < 4.5");
  });

  it("mide el texto de los campos (valor, opcion elegida, placeholder) y espera el h1 concreto", () => {
    expect(SPEC).toContain("selectedOptions");
    expect(SPEC).toContain("::placeholder");
    expect(SPEC).toContain("camposTema");
    expect(SPEC).toContain("level: 1, name: p.titulo");
  });

  it("solo usa credenciales QA del entorno y emite RESULT_MF3_T3=PASS", () => {
    expect(SPEC).toContain("process.env.QA_USER");
    expect(SPEC).toContain("process.env.QA_PASSWORD");
    expect(SPEC).toContain('console.log("RESULT_MF3_T3=PASS")');
  });
});
