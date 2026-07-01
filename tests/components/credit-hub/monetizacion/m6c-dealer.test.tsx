import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEALER_METRICS_MAY_2026, DRILLDOWNS } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionMetricasDealerClient } from "@/app/(forge)/credit-hub/monetizacion/metricas-dealer/MonetizacionMetricasDealerClient";

const mockOpenTrace = jest.fn();

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: () => ({
    tenantId: "auto-credito-cibao",
    setTenantId: jest.fn(),
    openTrace: mockOpenTrace,
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
jest.mock("@/components/credit-hub/monetizacion/ui/screen-states.css", () => ({}));

describe("Monetización M6c-P6 Métricas dealer", () => {
  beforeEach(() => mockOpenTrace.mockClear());

  const wrap = () =>
    render(
      <div className="forge-monetizacion">
        <MonetizacionMetricasDealerClient
          metrics={DEALER_METRICS_MAY_2026}
          drilldowns={DRILLDOWNS}
        />
      </div>,
    );

  test("renders funnel and fees card", () => {
    wrap();
    expect(screen.getByText(/panel del dealer/)).toBeInTheDocument();
    expect(screen.getByText("Look-to-book")).toBeInTheDocument();
    expect(screen.getByText(/92% del límite/)).toBeInTheDocument();
    expect(screen.getByText(/RD\$ 18,000/)).toBeInTheDocument();
  });

  test("renders bank mix winners", () => {
    wrap();
    expect(screen.getByText("Mix de bancos ganadores")).toBeInTheDocument();
    expect(screen.getByText("Banco del Cibao")).toBeInTheDocument();
  });

  test("volume KPI opens gmv drilldown (MD6)", async () => {
    wrap();
    await userEvent.click(screen.getByRole("button", { name: /Volumen financiado/ }));
    expect(mockOpenTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        drilldown: DRILLDOWNS.gmv,
        aggFormatted: "RD$ 23.4M",
      }),
    );
  });

  test("fees card opens base drilldown (MD6)", async () => {
    wrap();
    await userEvent.click(screen.getByRole("button", { name: /Fees del dealer/ }));
    expect(mockOpenTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        drilldown: DRILLDOWNS.base,
        aggFormatted: "RD$ 18,000",
      }),
    );
  });
});
