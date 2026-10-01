/**
 * Fuera los mapas de simbolo escritos a mano del cockpit del dealer (#1527).
 *
 * Dos sitios decidian el simbolo con un `if` sobre el codigo:
 *
 *   DealerKpiStrip.tsx:121          unit: currency === "DOP" ? "RD$" : currency
 *   OfferComparatorSpotlight.tsx:43 currency === "DOP" ? "RD$" : "MX$"
 *
 * El segundo es el peor: su caso por defecto era "MX$", asi que un tenant
 * argentino veia pesos mexicanos. Ahora el simbolo lo da Intl desde el codigo
 * del tenant, y sin codigo no hay simbolo.
 */
import { render, screen } from "@testing-library/react";

import { simboloDeMoneda } from "@/lib/credit-hub/dealer/dealerFormat";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("@/lib/credit-hub/hooks/useBanksRanking", () => ({
  useBanksRanking: () => ({ data: undefined, isLoading: false, error: null }),
}));

jest.mock("@/lib/credit-hub/hooks/useApplicationOffers", () => ({
  useApplicationOffers: () => ({ offers: [], isLoading: false, isError: false }),
}));

import { DealerKpiStrip } from "@/components/credit-hub/dealer/elite/DealerKpiStrip";

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
});

describe("DealerKpiStrip", () => {
  function montar(currency: string | null, locale?: string) {
    return render(
      <DealerKpiStrip pipelineAmount={38_500_000} currency={currency} locale={locale} weekCount={0} />,
    );
  }

  it("el pipeline sale en la moneda del tenant, sin unit escrito a mano", () => {
    montar("ARS", "es-AR");
    expect(screen.getByText(/38\.500\.000/)).toBeInTheDocument();
    expect(screen.queryByText("RD$")).toBeNull();
  });

  it("un tenant dominicano sigue viendo su moneda", () => {
    montar("DOP", "es-DO");
    expect(screen.getByText(/38,500,000/)).toBeInTheDocument();
  });

  it("sin moneda del tenant el pipeline no publica un importe", () => {
    montar(null);
    expect(screen.queryByText(/38/)).toBeNull();
    expect(screen.queryByText("RD$")).toBeNull();
  });
});
