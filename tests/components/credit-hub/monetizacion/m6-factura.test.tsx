import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DRILLDOWNS, INVOICE_MAY_2026 } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionFacturaClient } from "@/app/(forge)/credit-hub/monetizacion/estado-cuenta/MonetizacionFacturaClient";

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

jest.mock("@/app/(forge)/credit-hub/monetizacion/estado-cuenta/factura-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-controls.css", () => ({}));

describe("Monetización M6b Factura", () => {
  beforeEach(() => mockOpenTrace.mockClear());

  test("renders invoice totals", () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionFacturaClient invoice={INVOICE_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );
    expect(screen.getByText(/391,900/)).toBeInTheDocument();
    expect(screen.getByText(/70,542/)).toBeInTheDocument();
    expect(screen.getByText(/462,442/)).toBeInTheDocument();
  });

  test("invoice line opens trace drawer", async () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionFacturaClient invoice={INVOICE_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );
    await userEvent.click(screen.getByText("Comisión sobre préstamos fundeados"));
    expect(mockOpenTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        drilldown: DRILLDOWNS.comision,
        aggFormatted: "RD$ 235,500.00",
      }),
    );
  });

  test("renders four invoice lines", () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionFacturaClient invoice={INVOICE_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );
    expect(screen.getByText("AI metered")).toBeInTheDocument();
    expect(screen.getByText("Seats")).toBeInTheDocument();
  });
});
