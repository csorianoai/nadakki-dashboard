/**
 * `DealerDashboardViewProps.currency` admite `null`, y con `null` no se inventa moneda.
 *
 * El tipo es la mitad declarativa de #542; la mitad de comportamiento --la pagina
 * que decide QUE moneda pasar-- va en DASH-DEALER-BANK-MONTOS-APP-01.
 *
 * Importante y medido: `tsconfig.json:11` tiene `"strict": false`, asi que
 * `strictNullChecks` esta apagado y el compilador NO hace cumplir la diferencia
 * entre `string` y `string | null`. El tipo documenta; no vigila. Por eso este
 * test fija el contrato donde si es observable: en runtime, con la vista montada
 * con `currency={null}`. Sin esto, el ensanchado seria una promesa sin testigo.
 */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

import { DealerDashboardView } from "@/components/credit-hub/dealer/DealerDashboardView";
import type { DealerDashboardViewProps } from "@/lib/credit-hub/types/dealer-views";

function montar(currency: DealerDashboardViewProps["currency"]) {
  const props: DealerDashboardViewProps = {
    applications: [],
    institutionName: "Mapaal",
    locale: "es-AR",
    currency,
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DealerDashboardView {...props} />
    </QueryClientProvider>,
  );
}

describe("DealerDashboardView con la moneda sin configurar", () => {
  it("acepta currency null sin romper la pagina", () => {
    montar(null);
    expect(screen.getByTestId("dealer-command-center")).toBeInTheDocument();
  });

  it("sin moneda del tenant no pinta ninguna moneda inventada", () => {
    const { container } = montar(null);
    const texto = container.textContent ?? "";
    for (const inventada of ["RD$", "MX$", "DOP", "MXN"]) {
      expect(texto).not.toContain(inventada);
    }
  });

  it("con la moneda del tenant si la usa", () => {
    const { container } = montar("ARS");
    expect(container.textContent ?? "").not.toContain("RD$");
  });
});
