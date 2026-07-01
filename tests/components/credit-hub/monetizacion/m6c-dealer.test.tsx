import { render, screen } from "@testing-library/react";
import { DEALER_METRICS_MAY_2026 } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionMetricasDealerClient } from "@/app/(forge)/credit-hub/monetizacion/metricas-dealer/MonetizacionMetricasDealerClient";

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: () => ({
    tenantId: "auto-credito-cibao",
    setTenantId: jest.fn(),
    openTrace: jest.fn(),
    closeTrace: jest.fn(),
  }),
  DEMO_TENANTS: [
    {
      id: "auto-credito-cibao",
      label: "Auto Crédito del Cibao",
      subtitle: "Dealer · Pro",
      initials: "AC",
      accent: "#a98bf0",
    },
  ],
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/metricas-dealer/metricas-dealer-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));

describe("Monetización M6c-P6 Métricas dealer", () => {
  test("renders funnel and fees card", () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionMetricasDealerClient metrics={DEALER_METRICS_MAY_2026} />
      </div>,
    );
    expect(screen.getByText(/panel del dealer/)).toBeInTheDocument();
    expect(screen.getByText("Look-to-book")).toBeInTheDocument();
    expect(screen.getByText(/92% del límite/)).toBeInTheDocument();
    expect(screen.getByText(/RD\$ 18,000/)).toBeInTheDocument();
  });

  test("renders bank mix winners", () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionMetricasDealerClient metrics={DEALER_METRICS_MAY_2026} />
      </div>,
    );
    expect(screen.getByText("Mix de bancos ganadores")).toBeInTheDocument();
    expect(screen.getByText("Banco del Cibao")).toBeInTheDocument();
  });
});
