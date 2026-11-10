import { calcularVariacion, estadoEfectivo, formatearValor, formatearFecha } from "@/lib/analytics/cifra";
import * as F from "./fixtures/cifras.fixture";

describe("calcularVariacion", () => {
  it("variacion positiva", () => {
    expect(calcularVariacion(120, 100)).toEqual({ estado: "ok", porcentaje: 20, direccion: "up" });
  });
  it("variacion negativa", () => {
    expect(calcularVariacion(1.5, 2)).toEqual({ estado: "ok", porcentaje: -25, direccion: "down" });
  });
  it("variacion cero", () => {
    expect(calcularVariacion(40, 40)).toEqual({ estado: "ok", porcentaje: 0, direccion: "neutral" });
  });
  it("periodo anterior 0 => datos insuficientes, nunca Infinity", () => {
    expect(calcularVariacion(10, 0)).toEqual({ estado: "datos_insuficientes" });
  });
  it.each([[null], [undefined], [Number.NaN], [Number.POSITIVE_INFINITY]])("anterior %p => datos insuficientes", (a) => {
    expect(calcularVariacion(10, a as number | null)).toEqual({ estado: "datos_insuficientes" });
  });
  it.each([[null], [Number.NaN], [Number.NEGATIVE_INFINITY]])("actual %p => datos insuficientes", (v) => {
    expect(calcularVariacion(v as number | null, 5)).toEqual({ estado: "datos_insuficientes" });
  });
  it("anterior negativo usa magnitud del anterior", () => {
    const r = calcularVariacion(-5, -10);
    expect(r.estado).toBe("ok");
    if (r.estado === "ok") expect(r.porcentaje).toBe(50);
  });
});

describe("estadoEfectivo", () => {
  it("ok con fuente y fecha", () => expect(estadoEfectivo(F.CIFRA_SUBE)).toBe("ok"));
  it("sin fuente => pendiente_integracion", () => expect(estadoEfectivo(F.CIFRA_SIN_FUENTE)).toBe("pendiente_integracion"));
  it("sin fecha => pendiente_integracion", () => expect(estadoEfectivo(F.CIFRA_SIN_FECHA)).toBe("pendiente_integracion"));
  it("valor no finito => datos_insuficientes", () => expect(estadoEfectivo(F.CIFRA_NO_FINITA)).toBe("datos_insuficientes"));
  it("respeta estados no ok declarados", () => {
    expect(estadoEfectivo({ ...F.CIFRA_SUBE, estado: "error" })).toBe("error");
    expect(estadoEfectivo({ ...F.CIFRA_SUBE, estado: "cargando" })).toBe("cargando");
    expect(estadoEfectivo({ ...F.CIFRA_SUBE, estado: "vacio" })).toBe("vacio");
  });
});

describe("formato", () => {
  it("fecha ISO determinista en UTC", () => expect(formatearFecha("2026-11-10")).toBe("10 nov 2026"));
  it("fecha invalida => null", () => expect(formatearFecha("no-es-fecha")).toBeNull());
  it("numero", () => expect(formatearValor(F.CIFRA_SUBE)).toMatch(/^120$/));
  it("porcentaje", () => expect(formatearValor(F.CIFRA_BAJA).replace(/\s/g, " ")).toBe("1,5 %"));
  it("moneda", () => expect(formatearValor(F.CIFRA_COSTO_SUBE)).toMatch(/12/));
  it("nunca devuelve NaN ni Infinity", () => {
    expect(formatearValor(F.CIFRA_NO_FINITA)).toBe("—");
  });
});
