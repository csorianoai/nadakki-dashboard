/**
 * La moneda de un asiento es un codigo ISO-4217, no una lista de dos.
 *
 * `ContableCurrency` era `"DOP" | "USD"`. Eso dejaba a un tenant argentino sin
 * poder registrar un asiento en ARS: dinero incorrecto, no un detalle de tipos.
 * El backend no cierra la lista --`fx.py:35-39` solo exige tres letras-- y
 * resuelve la moneda funcional sin fallback.
 *
 * El caso que mas importa: con el campo vacio NO se envia moneda, para que el
 * backend aplique la funcional del tenant. Si alguien pone un valor por defecto
 * aqui, esos casos ponen rojo.
 */
import {
  MONEDA_ERROR_CODES,
  currencyParaEnviar,
  errorDeMoneda,
  esIso4217,
  monedaFuncionalDe,
  normalizaIso4217,
} from "@/lib/contable/moneda-asiento";
import type { ContableCurrency } from "@/types/contable";

describe("el tipo ya no es una lista cerrada", () => {
  it("ARS es una moneda valida de asiento", () => {
    const ars: ContableCurrency = "ARS";
    expect(esIso4217(ars)).toBe(true);
  });

  it("y COP, y MXN, y las que vengan", () => {
    for (const codigo of ["ARS", "COP", "MXN", "DOP", "USD", "EUR", "BRL"]) {
      expect(esIso4217(codigo)).toBe(true);
    }
  });

  it("mismo criterio que `_iso3` del backend: tres letras, nada mas", () => {
    for (const malo of ["AR", "ARSS", "AR1", "", "  ", null, undefined, "$$$"]) {
      expect(esIso4217(malo)).toBe(false);
    }
  });

  it("normaliza a mayusculas y recorta", () => {
    expect(normalizaIso4217(" ars ")).toBe("ARS");
    expect(normalizaIso4217("usd")).toBe("USD");
    expect(normalizaIso4217("AR")).toBeNull();
  });
});

describe("currencyParaEnviar", () => {
  it("vacio significa OMITIR el campo, para que el backend use la funcional", () => {
    expect(currencyParaEnviar("")).toBeNull();
    expect(currencyParaEnviar("   ")).toBeNull();
    expect(currencyParaEnviar(null)).toBeNull();
    expect(currencyParaEnviar(undefined)).toBeNull();
  });

  it("no cae a DOP ni a ninguna otra por defecto", () => {
    expect(currencyParaEnviar("")).not.toBe("DOP");
    expect(currencyParaEnviar(null)).not.toBe("USD");
  });

  it("con un codigo valido lo envia normalizado", () => {
    expect(currencyParaEnviar(" ars ")).toBe("ARS");
  });

  it("un codigo invalido no se envia a medias", () => {
    expect(currencyParaEnviar("AR")).toBeNull();
    expect(currencyParaEnviar("PESOS")).toBeNull();
  });
});

describe("errores de moneda del backend", () => {
  it("el tenant sin moneda funcional se explica, no se muestra el codigo a secas", () => {
    const error = errorDeMoneda("FUNCTIONAL_CURRENCY_NOT_CONFIGURED: no active legal entity");
    expect(error?.codigo).toBe(MONEDA_ERROR_CODES.FUNCTIONAL_CURRENCY_NOT_CONFIGURED);
    expect(error?.copia).toContain("moneda funcional");
  });

  it("D4_MONEDA dice que hacen falta tres letras", () => {
    expect(errorDeMoneda("D4_MONEDA: currency debe ser ISO-4217 de 3 letras")?.copia).toContain("ISO-4217");
  });

  it("D1_FX_QUOTE ofrece la salida: registrar en la moneda funcional", () => {
    expect(errorDeMoneda({ detail: "D1_FX_QUOTE: sin cotizacion" })?.copia).toContain("moneda funcional");
  });

  it("un error ajeno no se traduce a uno de moneda", () => {
    expect(errorDeMoneda("C9_PERIODO: periodo cerrado")).toBeNull();
    expect(errorDeMoneda(null)).toBeNull();
  });
});

describe("monedaFuncionalDe", () => {
  it("la lee del asiento que respondio el backend", () => {
    expect(monedaFuncionalDe({ functional_currency: "ARS" })).toBe("ARS");
  });

  it("sin el campo no inventa ninguna", () => {
    expect(monedaFuncionalDe({})).toBeNull();
    expect(monedaFuncionalDe(null)).toBeNull();
    expect(monedaFuncionalDe({ functional_currency: null })).toBeNull();
    expect(monedaFuncionalDe({ functional_currency: "XX" })).toBeNull();
  });
});
