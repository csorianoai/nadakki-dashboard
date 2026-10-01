/**
 * El cockpit del dealer pinta la moneda del TENANT, sin simbolos a mano (#1527 serie A).
 *
 * Segunda mitad de la division de #536. La pieza de lib --`simboloDeMoneda`--
 * entro en DASH-DEALER-ELITE-SIMBOLO-LIB-01; aqui se cablean sus dos
 * consumidores:
 *
 *   DealerKpiStrip.tsx:121          unit: currency === "DOP" ? "RD$" : currency
 *   OfferComparatorSpotlight.tsx:43 currency === "DOP" ? "RD$" : "MX$"
 *
 * El KPI de pipeline pasa a formatear con `formatDealerMoney` --que es
 * `formateaMoneda` (#517) por debajo-- y pierde el `unit`: la moneda ya va DENTRO
 * del importe. Se pierde con ello la notacion compacta (1,2M); es un cambio
 * visible y va anotado, el pulido visual es su propia fase.
 */
import { render, screen } from "@testing-library/react";

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

describe("DealerKpiStrip", () => {
  function montar(currency: string | null, locale?: string) {
    return render(
      <DealerKpiStrip pipelineAmount={38_500_000} currency={currency} locale={locale} weekCount={0} />,
    );
  }

  /**
   * `MetricCard` pinta el `unit` en su PROPIO span, hermano del valor
   * (MetricCard.tsx:83). Por eso un `getByText` exacto del simbolo suelto
   * distingue las dos situaciones: con el simbolo a mano hay un span cuyo texto
   * es exactamente "RD$" o "MX$"; con Intl el simbolo va dentro del importe,
   * en el mismo span, y ese span exacto no existe.
   */
  function simboloSuelto(simbolo: string) {
    return screen.queryByText((contenido) => contenido.trim() === simbolo);
  }

  it("el pipeline sale en la moneda del tenant, sin unit escrito a mano", () => {
    montar("ARS", "es-AR");
    expect(screen.getByText(/38\.500\.000/)).toBeInTheDocument();
    expect(simboloSuelto("RD$")).toBeNull();
    expect(simboloSuelto("MX$")).toBeNull();
    expect(simboloSuelto("ARS")).toBeNull();
  });

  it("un tenant dominicano ve su moneda DENTRO del importe, no como unit aparte", () => {
    montar("DOP", "es-DO");
    expect(screen.getByText(/38,500,000/)).toBeInTheDocument();
    expect(screen.getByText(/RD\$\s*38,500,000/)).toBeInTheDocument();
    expect(simboloSuelto("RD$")).toBeNull();
    expect(simboloSuelto("MX$")).toBeNull();
  });

  it("sin moneda del tenant el pipeline no publica un importe ni un simbolo", () => {
    montar(null);
    expect(screen.queryByText(/38/)).toBeNull();
    expect(simboloSuelto("RD$")).toBeNull();
    expect(simboloSuelto("MX$")).toBeNull();
  });
});
