import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BANK_METRICS_MAY_2026, DRILLDOWNS } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionMetricasBancoClient } from "@/app/(forge)/credit-hub/monetizacion/metricas-banco/MonetizacionMetricasBancoClient";

const mockOpenTrace = jest.fn();

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: () => ({
    tenantId: "banco-cibao",
    setTenantId: jest.fn(),
    openTrace: mockOpenTrace,
    closeTrace: jest.fn(),
  }),
  DEMO_TENANTS: [
    { id: "banco-cibao", label: "Banco del Cibao", subtitle: "Banco · Híbrido (B2)", initials: "BC", accent: "#2bd073" },
  ],
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/metricas-banco/metricas-banco-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));

describe("Monetización M6c-P5 Métricas banco", () => {
  beforeEach(() => mockOpenTrace.mockClear());

  test("renders funnel and white-label header", () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionMetricasBancoClient metrics={BANK_METRICS_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );
    expect(screen.getByText(/panel del banco/)).toBeInTheDocument();
    expect(screen.getByText("Solicitudes recibidas")).toBeInTheDocument();
    expect(screen.getByText(/462,442/)).toBeInTheDocument();
  });

  test("AI card opens ai drilldown", async () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionMetricasBancoClient metrics={BANK_METRICS_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );
    await userEvent.click(screen.getByText("Consumo de IA"));
    expect(mockOpenTrace).toHaveBeenCalledWith(
      expect.objectContaining({ drilldown: DRILLDOWNS.ai, aggFormatted: "RD$ 59,400.00" }),
    );
  });
});
