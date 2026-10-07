import { porcentaje, puntosPorcentuales } from "@/components/credit-hub/bank-v2/comun/formato";

const NBSP = " ";

describe("porcentaje del banco v2 (AUDIT-COWORK 4/9)", () => {
  it("es-DO: siempre '0 %', con los separadores del locale", () => {
    expect(porcentaje(0, { locale: "es-DO", currency: "DOP" })).toBe(`0${NBSP}%`);
    expect(porcentaje(0.125, { locale: "es-DO", currency: "DOP" })).toBe(`12.5${NBSP}%`);
    expect(porcentaje(1, { locale: "es-DO", currency: "DOP" })).toBe(`100${NBSP}%`);
  });

  it("es: coma decimal y el mismo espacio duro", () => {
    expect(porcentaje(0.125, { locale: "es", currency: null })).toBe(`12,5${NBSP}%`);
  });

  it("sin dato no inventa 0", () => {
    expect(porcentaje(null, { locale: "es-DO", currency: null })).toBeNull();
    expect(porcentaje(Number.NaN, { locale: "es-DO", currency: null })).toBeNull();
  });

  it("puntos porcentuales (tasa de interes) con el mismo formato", () => {
    expect(puntosPorcentuales(17.25, { locale: "es-DO", currency: null })).toBe(`17.25${NBSP}%`);
    expect(puntosPorcentuales(undefined, { locale: "es-DO", currency: null })).toBeNull();
  });
});
