import { clasificarCpa, estaDesactualizado, geometriaBarra, muestraPequena } from "../semaforo";

describe("semaforo economico (logica pura)", () => {
  it("ubica el CPA frente a objetivo y equilibrio", () => {
    expect(clasificarCpa(47.11, 50, 75)).toBe("bajo_objetivo");
    expect(clasificarCpa(50, 50, 75)).toBe("bajo_objetivo");
    expect(clasificarCpa(60, 50, 75)).toBe("entre_objetivo_equilibrio");
    expect(clasificarCpa(75, 50, 75)).toBe("entre_objetivo_equilibrio");
    expect(clasificarCpa(80, 50, 75)).toBe("sobre_equilibrio");
  });
  it("sin datos validos => datos_insuficientes, nunca NaN", () => {
    for (const args of [[null, 50, 75], [47, null, 75], [47, 50, null], [Number.NaN, 50, 75], [47, 0, 75], [47, 50, 0], [47, 80, 75], [Number.POSITIVE_INFINITY, 50, 75]] as const) {
      expect(clasificarCpa(args[0], args[1], args[2])).toBe("datos_insuficientes");
    }
  });
  it("muestra pequena con pocas conversiones o nulo", () => {
    expect(muestraPequena(13)).toBe(true);
    expect(muestraPequena(15)).toBe(false);
    expect(muestraPequena(null)).toBe(true);
  });
  it("geometria de la barra: equilibrio en 75 %, marcador acotado y sin division por cero", () => {
    const g = geometriaBarra(47.11, 50, 75);
    expect(g?.equilibrioPct).toBeCloseTo(75, 5);
    expect(g?.objetivoPct).toBeCloseTo(50, 5);
    expect(g?.marcadorPct).toBeCloseTo(47.11, 2);
    expect(geometriaBarra(500, 50, 75)?.marcadorPct).toBe(100);
    expect(geometriaBarra(-5, 50, 75)?.marcadorPct).toBe(0);
    expect(geometriaBarra(47, 50, 0)).toBeNull();
    expect(geometriaBarra(null, 50, 75)).toBeNull();
  });
  it("frescura: mas de 36 h es desactualizado; fecha invalida tambien", () => {
    expect(estaDesactualizado("2026-11-09T14:00:00Z", "2026-11-10T02:00:00Z")).toBe(false);
    expect(estaDesactualizado("2026-11-07T14:00:00Z", "2026-11-10T02:00:00Z")).toBe(true);
    expect(estaDesactualizado(null, "2026-11-10T02:00:00Z")).toBe(true);
    expect(estaDesactualizado("basura", "2026-11-10T02:00:00Z")).toBe(true);
  });
});
