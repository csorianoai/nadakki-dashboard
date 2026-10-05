import {
  formatEntero,
  formatFecha,
  formatMoneda,
  formatMonedaCompacta,
  formatPorcentaje,
  localeDeTenant,
} from "@/lib/dcc/formato";

/** Intl usa espacios duros (U+00A0 / U+202F); se normalizan para comparar. */
const n = (s: string | null) => (s === null ? null : s.replace(/[  ]/g, " "));

const MAPAAL = localeDeTenant({ locale: "es-AR", currency: "ARS" });

describe("formato del tenant (DCC)", () => {
  it("Mapaal ve el importe compacto como '$ 182,4 M'", () => {
    expect(n(formatMonedaCompacta(182_400_000, MAPAAL))).toBe("$ 182,4 M");
  });

  it("el separador sale del locale: en-US queda sin espacio", () => {
    const usa = localeDeTenant({ locale: "en-US", currency: "USD" });
    expect(n(formatMonedaCompacta(182_400_000, usa))).toBe("$182.4M");
  });

  it("importe completo con el formato del tenant", () => {
    expect(n(formatMoneda(182_400_000, MAPAAL))).toBe("$ 182.400.000,00");
  });

  it("sin moneda configurada no se inventa una: devuelve null", () => {
    const sinMoneda = localeDeTenant({ locale: "es-AR", currency: null });
    expect(formatMoneda(10, sinMoneda)).toBeNull();
    expect(formatMonedaCompacta(10, sinMoneda)).toBeNull();
  });

  it("valores ausentes o no numericos devuelven null, nunca 0", () => {
    expect(formatEntero(null, MAPAAL)).toBeNull();
    expect(formatEntero("12", MAPAAL)).toBeNull();
    expect(formatMoneda(Number.NaN, MAPAAL)).toBeNull();
    expect(formatPorcentaje(undefined, MAPAAL)).toBeNull();
  });

  it("enteros y porcentajes con el locale del tenant", () => {
    expect(formatEntero(12345, MAPAAL)).toBe("12.345");
    expect(n(formatPorcentaje(0.125, MAPAAL))).toBe("12,5%");
  });

  it("fechas en el locale del tenant; fecha invalida es null", () => {
    expect(formatFecha("2026-10-04T12:00:00Z", MAPAAL)).toMatch(/oct/);
    expect(formatFecha("no-es-fecha", MAPAAL)).toBeNull();
  });
});
