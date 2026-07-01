import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DRILLDOWNS, REVENUE_ANALYTICS_MAY_2026 } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionIngresosClient } from "@/app/(forge)/credit-hub/monetizacion/ingresos/MonetizacionIngresosClient";

const mockOpenTrace = jest.fn();

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: jest.fn(),
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/ingresos/ingresos-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/screen-states.css", () => ({}));

const { useMonetizacionShell } = jest.requireMock("@/components/credit-hub/monetizacion/shell");

describe("Monetización M8-P2 Ingresos", () => {
  beforeEach(() => {
    mockOpenTrace.mockClear();
    useMonetizacionShell.mockReturnValue({
      tenantId: "nadakki-operador",
      setTenantId: jest.fn(),
      openTrace: mockOpenTrace,
      closeTrace: jest.fn(),
    });
  });

  const wrap = () =>
    render(
      <div className="forge-monetizacion">
        <MonetizacionIngresosClient revenue={REVENUE_ANALYTICS_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );

  test("operador sees revenue KPIs and tenant table", () => {
    wrap();
    expect(screen.getByText("Ingreso total")).toBeInTheDocument();
    expect(screen.getByText("Ingreso por tenant")).toBeInTheDocument();
    expect(screen.getByText("Banco Nacional RD")).toBeInTheDocument();
  });

  test("banco tenant is blocked from ingresos", () => {
    useMonetizacionShell.mockReturnValue({
      tenantId: "banco-cibao",
      setTenantId: jest.fn(),
      openTrace: mockOpenTrace,
      closeTrace: jest.fn(),
    });
    wrap();
    expect(screen.getByText(/Vista de operador · solo Nadakki ve datos cross-tenant/)).toBeInTheDocument();
    expect(screen.queryByText("Ingreso por tenant")).not.toBeInTheDocument();
  });

  test("dealer tenant is blocked from ingresos", () => {
    useMonetizacionShell.mockReturnValue({
      tenantId: "auto-credito-cibao",
      setTenantId: jest.fn(),
      openTrace: mockOpenTrace,
      closeTrace: jest.fn(),
    });
    wrap();
    expect(screen.getByText(/Vista de operador · solo Nadakki ve datos cross-tenant/)).toBeInTheDocument();
  });

  test("GMV KPI opens gmv drilldown", async () => {
    wrap();
    await userEvent.click(screen.getByRole("button", { name: /GMV financiado/ }));
    expect(mockOpenTrace).toHaveBeenCalledWith(
      expect.objectContaining({ drilldown: DRILLDOWNS.gmv, aggFormatted: "RD$ 264.3M" }),
    );
  });
});
