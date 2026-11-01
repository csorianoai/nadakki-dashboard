/**
 * MF3-T3 (diagnose, vuelta 2) — la evidencia corre contra `next dev` (staging ya no hace build+start: 7c2b9657).
 * `next dev` compila cada ruta en frio y dos workers compilan a la vez; el spec de contraste navega 4 rutas x 2 temas
 * con 45 s por encabezado y 300 s en total. Guarda estatica (sin navegador) de las medidas estables, como en MF3-T2.
 */
import * as fs from "fs";
import * as path from "path";

const SPEC = fs.readFileSync(path.join(process.cwd(), "e2e", "mapaal-f3", "t3-contraste.spec.ts"), "utf8");

describe("MF3-T3 spec estable con next dev", () => {
  it("corre en serie (sin dos compilaciones en frio simultaneas)", () => {
    expect(SPEC).toContain('test.describe.configure({ mode: "serial" })');
  });

  it("precalienta las 4 rutas contables antes de los tests", () => {
    expect(SPEC).toContain("test.beforeAll");
    expect(SPEC).toMatch(/request\.get\(/);
    for (const r of ["plan-cuentas", "libro-mayor", "asientos/nuevo", "balance-comprobacion"]) {
      expect(SPEC.slice(SPEC.indexOf("test.beforeAll"), SPEC.indexOf("test.describe("))).toContain(r);
    }
  });

  it("el encabezado de cada pantalla espera >= 60 s (compilacion en frio), no 45 s", () => {
    expect(SPEC).not.toMatch(/timeout: 45_000/);
    expect(SPEC).toMatch(/timeout: 60_000/);
  });

  it("el test principal tiene margen para 8 navegaciones en frio (>= 420 s)", () => {
    expect(SPEC).toMatch(/test\.setTimeout\((4[2-9]\d|[5-9]\d\d)_000\)/);
  });
});
