/** Formato por tenant: locale y moneda salen de la configuracion de cada tenant; defecto es-US / USD; nada fijo en el kit. */
import {
  FORMATO_POR_DEFECTO,
  formatearDias,
  formatearFecha,
  formatearFechaCorta,
  formatearMoneda,
  formatearNumero,
  formatearPorcentaje,
  formatoDesdeTenant,
  normalizarFormato,
} from "@/lib/analytics/formato";
import { formatearValor } from "@/lib/analytics/cifra";
import { ordenarPor } from "@/lib/analytics/tabla";

const norm = (s: string | null) => (s ?? "").replace(/[\s  ]+/g, " ").trim();

const BAYLARA = formatoDesdeTenant({ locale: "en-US", currency: "USD" });
const MAPAAL = formatoDesdeTenant({ locale: "es-AR", currency: "ARS" });

describe("valores por defecto", () => {
  it("es-US / USD", () => expect(FORMATO_POR_DEFECTO).toEqual({ locale: "es-US", moneda: "USD" }));
  it("sin formato: $612.40 y 4,820", () => {
    expect(formatearMoneda(612.4)).toBe("$612.40");
    expect(formatearNumero(4820)).toBe("4,820");
  });
  it("el valor por defecto esta congelado (ningun componente puede mutarlo)", () => expect(Object.isFrozen(FORMATO_POR_DEFECTO)).toBe(true));
});

describe("Baylara (en-US / USD)", () => {
  it("moneda y numero", () => {
    expect(BAYLARA).toEqual({ locale: "en-US", moneda: "USD" });
    expect(formatearMoneda(612.4, BAYLARA)).toBe("$612.40");
    expect(formatearNumero(4820, BAYLARA)).toBe("4,820");
  });
  it("porcentaje y fecha", () => {
    expect(formatearPorcentaje(1.5, BAYLARA, 1)).toBe("1.5%");
    expect(formatearFecha("2026-11-10", BAYLARA)).toBe("Nov 10, 2026");
    expect(formatearFechaCorta("2026-11-10", BAYLARA)).toBe("Nov 10");
  });
});

describe("MAPAAL (es-AR / ARS)", () => {
  it("moneda con separadores argentinos: $ 612,40", () => {
    expect(MAPAAL).toEqual({ locale: "es-AR", moneda: "ARS" });
    expect(norm(formatearMoneda(612.4, MAPAAL))).toBe("$ 612,40");
  });
  it("numero con punto de miles y coma decimal", () => {
    expect(formatearNumero(4820, MAPAAL)).toBe("4.820");
    expect(formatearNumero(1234567.891, MAPAAL)).toBe("1.234.567,89");
  });
  it("porcentaje con coma decimal", () => expect(norm(formatearPorcentaje(1.5, MAPAAL, 1))).toMatch(/^1,5\s?%$/));
  it("fecha en espanol de Argentina, en UTC", () => expect(formatearFecha("2026-11-10", MAPAAL)).toMatch(/^10 de nov(\.)? de 2026$/));
  it("el valor de una cifra usa el formato del tenant", () => {
    expect(norm(formatearValor({ valor: 612.4, unidad: "moneda" }, MAPAAL))).toBe("$ 612,40");
    expect(formatearValor({ valor: 4820, unidad: "numero" }, MAPAAL)).toBe("4.820");
  });
  it("la moneda propia de la cifra manda sobre la del tenant", () => {
    expect(formatearValor({ valor: 10, unidad: "moneda", moneda: "USD" }, MAPAAL)).not.toContain("$ 10,00"); // no es ARS
    expect(formatearValor({ valor: 10, unidad: "moneda", moneda: "EUR" }, BAYLARA)).toBe("€10.00");
  });
  it("sin moneda en la cifra, usa la del tenant (no un USD fijo)", () => {
    expect(norm(formatearValor({ valor: 10, unidad: "moneda" }, MAPAAL))).toBe("$ 10,00");
    expect(formatearValor({ valor: 10, unidad: "moneda" }, BAYLARA)).toBe("$10.00");
  });
  it("dias", () => expect(formatearDias(3.5, MAPAAL)).toBe("3,5 d"));
});

describe("formato invalido: cae al defecto sin lanzar", () => {
  it.each([
    [{ locale: "xx_@@", moneda: "ZZZZ" }],
    [{ locale: 123, moneda: null }],
    [{ locale: "", moneda: "" }],
    [{ locale: "!!", moneda: "us dollars" }],
    [{}],
    [null],
    [undefined],
  ])("normalizarFormato(%j)", (entrada) => {
    expect(() => normalizarFormato(entrada as never)).not.toThrow();
    expect(normalizarFormato(entrada as never)).toEqual(FORMATO_POR_DEFECTO);
  });
  it("un locale valido con moneda invalida conserva el locale; y al reves", () => {
    expect(normalizarFormato({ locale: "es-AR", moneda: "???" })).toEqual({ locale: "es-AR", moneda: "USD" });
    expect(normalizarFormato({ locale: "###", moneda: "ars" })).toEqual({ locale: "es-US", moneda: "ARS" });
  });
  it("las funciones de formato no lanzan con un formato roto", () => {
    const roto = { locale: "??", moneda: "??" };
    expect(() => formatearMoneda(1, roto)).not.toThrow();
    expect(formatearMoneda(1, roto)).toBe("$1.00");
    expect(() => formatearFecha("2026-11-10", roto)).not.toThrow();
  });
  it("fecha con hora y sin zona se lee en UTC (no se corre un dia)", () => {
    expect(formatearFecha("2026-11-10T23:30:00", BAYLARA)).toBe("Nov 10, 2026");
    expect(formatearFecha("2026-11-10 23:30:00", BAYLARA)).toBe("Nov 10, 2026");
    expect(formatearFecha("2026-11-10T23:30:00-05:00", BAYLARA)).toBe("Nov 11, 2026");
  });
  it("fecha invalida => null; fecha corta invalida => el texto tal cual", () => {
    expect(formatearFecha("no-es-fecha", MAPAAL)).toBeNull();
    expect(formatearFecha(null)).toBeNull();
    expect(formatearFechaCorta("Semana 3", MAPAAL)).toBe("Semana 3");
  });
});

describe("formatoDesdeTenant (adaptador tipado)", () => {
  it("TenantBranding: { locale, currency }", () => expect(formatoDesdeTenant({ locale: "es-DO", currency: "DOP" })).toEqual({ locale: "es-DO", moneda: "DOP" }));
  it("el propio FormatoTenant: { locale, moneda }", () => expect(formatoDesdeTenant({ locale: "es-AR", moneda: "ARS" })).toEqual({ locale: "es-AR", moneda: "ARS" }));
  it("TenantContext.settings: 'language' a secas es ambiguo y se ignora; con region vale", () => {
    expect(formatoDesdeTenant({ language: "es", currency: "USD" })).toEqual({ locale: "es-US", moneda: "USD" });
    expect(formatoDesdeTenant({ language: "es-AR", currency: "ARS" })).toEqual({ locale: "es-AR", moneda: "ARS" });
  });
  it("lee la config anidada en settings o branding", () => {
    expect(formatoDesdeTenant({ settings: { locale: "es-AR", currency: "ARS" } })).toEqual({ locale: "es-AR", moneda: "ARS" });
    expect(formatoDesdeTenant({ branding: { locale: "en-US", currency: "USD" } })).toEqual({ locale: "en-US", moneda: "USD" });
  });
  it("acepta guion bajo y moneda en minusculas", () => expect(formatoDesdeTenant({ locale: "es_AR", currency: "ars" })).toEqual({ locale: "es-AR", moneda: "ARS" }));
  it.each([[null], [undefined], ["es-AR"], [42], [[]], [{}]])("%j => defecto", (x) => {
    expect(formatoDesdeTenant(x)).toEqual(FORMATO_POR_DEFECTO);
  });
  it("devuelve una copia: mutar el resultado no altera el defecto", () => {
    const f = formatoDesdeTenant(null);
    (f as { locale: string }).locale = "xx";
    expect(FORMATO_POR_DEFECTO.locale).toBe("es-US");
  });
});

describe("orden de texto segun el locale del tenant", () => {
  const filas = ["zeta", "Álamo", "alfa", "Zorro"];
  it("ordena sin distinguir acentos ni mayusculas", () => {
    expect(ordenarPor(filas, (x) => x, "asc", MAPAAL)).toEqual(["Álamo", "alfa", "zeta", "Zorro"]);
  });
});
