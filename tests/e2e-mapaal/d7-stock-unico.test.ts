/**
 * Regresion del RESULT_D7=FAIL "aplicar -> 422": el backend rechaza con
 * STOCK_YA_EXISTE un `nro_stock` ya cargado (no actualiza), y D7 subia siempre
 * QA-D7-0001, asi que solo la primera corrida buena pasaba. Lo reintrodujo el
 * comentario del spec ("se ACTUALIZA") y los arreglos de login/reintento, que
 * nunca llegaron a aplicar. Si D7 vuelve a subir el fixture tal cual, esto falla.
 */
import { readFileSync } from "fs";
import path from "path";

import { stockUnico, xlsxConStock } from "../../e2e/mapaal/xlsx-unico";

const raiz = path.resolve(__dirname, "../..");
const fixture = readFileSync(path.join(raiz, "e2e/mapaal/fixtures/D7_plantilla_v4_qa.xlsx"));

describe("D7: cada corrida sube un nro_stock nuevo", () => {
  it("el spec reescribe el stock antes de subir", () => {
    const spec = readFileSync(path.join(raiz, "e2e/mapaal/D7.spec.ts"), "utf8");
    expect(spec).toContain("xlsxConStock(");
    expect(spec).not.toMatch(/setInputFiles\(FIXTURE\)/);
  });

  it("stockUnico cambia con el tiempo y es A-Z, 0-9, guion", () => {
    expect(stockUnico(1_000_000)).not.toBe(stockUnico(2_000_000));
    expect(stockUnico()).toMatch(/^QA-D7-[A-Z0-9]+$/);
  });

  it("reescribe Vehiculos y Costos y deja un xlsx legible", () => {
    const nuevo = stockUnico(123456789);
    const { buffer, cambios } = xlsxConStock(fixture, "QA-D7-0001", nuevo);
    expect(cambios).toBeGreaterThanOrEqual(2);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    const otra = xlsxConStock(buffer, nuevo, "QA-D7-0001");
    expect(otra.cambios).toBe(cambios);
    expect(xlsxConStock(buffer, "QA-D7-0001", "X").cambios).toBe(0);
  });
});
