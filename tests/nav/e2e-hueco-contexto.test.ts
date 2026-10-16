import { readFileSync } from "fs";
import { join } from "path";

// Guarda de la aserción e2e del hueco de contexto: debe admitir vacío o solo el selector.
describe("e2e volver-al-inicio: hueco-contexto", () => {
  const fuente = readFileSync(join(__dirname, "../../e2e/visual/volver-al-inicio.spec.ts"), "utf8");

  test("el hueco debe existir y no alojar nada salvo selector-contexto", () => {
    expect(fuente).toContain('getByTestId("hueco-contexto")).toHaveCount(1)');
    expect(fuente).toContain(':scope > :not([data-testid=selector-contexto])');
  });

  test("ya no exige que el hueco esté vacío", () => {
    expect(fuente).not.toMatch(/hueco-contexto"\)\)\.toBeEmpty\(\)/);
  });
});
