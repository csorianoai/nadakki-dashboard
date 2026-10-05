import { evaluaCuadre } from "@/lib/contable/cuadre";

describe("evaluaCuadre: veredicto unico de debe vs haber", () => {
  it("debe = haber = 0 cuadra (balance sin movimientos)", () => {
    expect(evaluaCuadre(0, 0)).toBe(true);
  });

  it("errores de coma flotante no rompen el cuadre", () => {
    expect(evaluaCuadre(0.1 + 0.2, 0.3)).toBe(true);
    expect(evaluaCuadre(182_400_000.1 + 0.2, 182_400_000.3)).toBe(true);
  });

  it("hasta 1 centavo de diferencia por redondeo cuadra", () => {
    expect(evaluaCuadre(100, 100.01)).toBe(true);
    expect(evaluaCuadre(100.01, 100)).toBe(true);
  });

  it("2 centavos o mas de diferencia no cuadra", () => {
    expect(evaluaCuadre(100, 100.02)).toBe(false);
    expect(evaluaCuadre(100, 99)).toBe(false);
    expect(evaluaCuadre(0, 50)).toBe(false);
  });

  it("totales no numericos: no se puede evaluar", () => {
    expect(evaluaCuadre(null, 0)).toBeNull();
    expect(evaluaCuadre(0, undefined)).toBeNull();
    expect(evaluaCuadre(Number.NaN, 0)).toBeNull();
  });
});
