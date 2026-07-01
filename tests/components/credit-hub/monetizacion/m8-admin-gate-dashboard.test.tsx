import { render, screen } from "@testing-library/react";
import { DASHBOARD_KPIS, DRILLDOWNS } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionDashboardClient } from "@/app/(forge)/credit-hub/monetizacion/dashboard/MonetizacionDashboardClient";

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: jest.fn(),
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/dashboard/dashboard-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/screen-states.css", () => ({}));

const { useMonetizacionShell } = jest.requireMock("@/components/credit-hub/monetizacion/shell");

describe("Monetización M8 admin gate · Dashboard P1", () => {
  beforeEach(() => {
    useMonetizacionShell.mockReturnValue({
      tenantId: "nadakki-operador",
      setTenantId: jest.fn(),
      openTrace: jest.fn(),
      closeTrace: jest.fn(),
    });
  });

  const wrap = () =>
    render(
      <div className="forge-monetizacion">
        <MonetizacionDashboardClient initialKpis={DASHBOARD_KPIS} drilldowns={DRILLDOWNS} />
      </div>,
    );

  test("operador sees god-view KPIs", () => {
    wrap();
    expect(screen.getByText("GMV financiado")).toBeInTheDocument();
    expect(screen.getByText("Tenants · ingreso, costo y margen")).toBeInTheDocument();
  });

  test("banco tenant is blocked from god-view", () => {
    useMonetizacionShell.mockReturnValue({
      tenantId: "banco-cibao",
      setTenantId: jest.fn(),
      openTrace: jest.fn(),
      closeTrace: jest.fn(),
    });
    wrap();
    expect(screen.getByText(/Vista de operador · solo Nadakki ve datos cross-tenant/)).toBeInTheDocument();
    expect(screen.queryByText("GMV financiado")).not.toBeInTheDocument();
  });

  test("dealer tenant is blocked from god-view", () => {
    useMonetizacionShell.mockReturnValue({
      tenantId: "auto-credito-cibao",
      setTenantId: jest.fn(),
      openTrace: jest.fn(),
      closeTrace: jest.fn(),
    });
    wrap();
    expect(screen.getByText(/Vista de operador · solo Nadakki ve datos cross-tenant/)).toBeInTheDocument();
    expect(screen.queryByText("GMV financiado")).not.toBeInTheDocument();
  });
});
