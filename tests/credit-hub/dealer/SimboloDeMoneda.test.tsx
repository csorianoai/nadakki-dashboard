/**
 * El simbolo de la moneda se le PREGUNTA a Intl; no se escribe a mano (#1527 serie A).
 *
 * Dos sitios del cockpit del dealer decidian el simbolo con un `if` sobre el codigo:
 *
 *   DealerKpiStrip.tsx:121          unit: currency === "DOP" ? "RD$" : currency
 *   OfferComparatorSpotlight.tsx:43 currency === "DOP" ? "RD$" : "MX$"
 *
 * El segundo es el peor: su caso por defecto era "MX$", asi que un tenant
 * argentino veia pesos mexicanos. Este packet trae solo la pieza de lib que
 * resuelve el simbolo; los dos consumidores se cablean en el packet de
 * componentes, que entra despues de este.
 */
import { simboloDeMoneda } from "@/lib/credit-hub/dealer/dealerFormat";

describe("simboloDeMoneda", () => {
  it("lo pregunta a Intl con el locale del tenant", () => {
    expect(simboloDeMoneda("DOP", "es-DO")).toBe("RD$");
    expect(simboloDeMoneda("ARS", "es-AR")).toBe("$");
    expect(simboloDeMoneda("USD", "es")).toBe("US$");
  });

  it("sin moneda del tenant no devuelve ningun simbolo", () => {
    expect(simboloDeMoneda(null)).toBe("");
    expect(simboloDeMoneda(undefined)).toBe("");
    expect(simboloDeMoneda("  ")).toBe("");
  });

  it("nunca cae a MX$ ni a RD$ por defecto", () => {
    for (const codigo of [null, undefined, "", "ARS", "COP"] as (string | null | undefined)[]) {
      expect(simboloDeMoneda(codigo, "es-AR")).not.toBe("MX$");
      expect(simboloDeMoneda(codigo, "es-AR")).not.toBe("RD$");
    }
  });

  it("un codigo que Intl no conoce se devuelve tal cual, no se sustituye", () => {
    expect(simboloDeMoneda("ZZZ", "es")).toBe("ZZZ");
  });

  it("el codigo se normaliza antes de preguntar", () => {
    expect(simboloDeMoneda(" dop ", "es-DO")).toBe("RD$");
  });
});
