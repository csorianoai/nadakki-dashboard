/**
 * @jest-environment node
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const raiz = join(__dirname, "../..");
const leer = (ruta: string) => readFileSync(join(raiz, ruta), "utf8");

const spec = leer("e2e/realtor/visual/alta.spec.ts");
const umbral = leer("e2e/realtor/visual/UMBRAL.md");
const refSh = leer("tests/realtor/visual/ref.sh");

describe("evidencia visual de la alta (parte 4/4)", () => {
  it("positivo: el spec compara /realtor/alta con ref/alta.png y el ref.sh la genera", () => {
    expect(spec).toContain("/realtor/alta");
    expect(spec).toContain("DL10A/ref/alta.png");
    expect(spec).toContain("DIFF_MEDIA");
    expect(refSh).toContain("alta.png");
  });

  it("el umbral del spec está documentado en UMBRAL.md y la nota explica la referencia", () => {
    const m = spec.match(/THRESHOLD = ([0-9.]+)/);
    expect(m).not.toBeNull();
    expect(umbral).toMatch(/Mi oficina/);
    expect(umbral).toMatch(new RegExp(`${Math.round(Number(m![1]) * 100)} ?%`));
  });

  it("negativo: el spec no depende de un acceso denegado para pasar (cubre 200 y falla si el diff supera el umbral)", () => {
    expect(spec).toMatch(/expect\(diff\)\.toBeLessThanOrEqual\(THRESHOLD\)/);
    expect(spec).not.toMatch(/toBeLessThanOrEqual\(1\)/);
  });

  it("tenant ajeno: ni el spec ni ref.sh envían tenant_id ni cabeceras de tenant", () => {
    for (const texto of [spec, refSh]) {
      expect(texto).not.toMatch(/tenant_id/i);
      expect(texto).not.toMatch(/x-tenant/i);
    }
  });
});
