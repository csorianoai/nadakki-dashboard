import { render, screen } from "@testing-library/react";
import { DASHBOARD_KPIS, DRILLDOWNS } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionDashboardClient } from "@/app/(forge)/credit-hub/monetizacion/dashboard/MonetizacionDashboardClient";

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: jest.fn(),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/dashboard/dashboard-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/screen-states.css", () => ({}));

const { useMonetizacionShell } = jest.requireMock("@/components/credit-hub/monetizacion/shell");
const { useAuth } = jest.requireMock("@/hooks/useAuth");

describe("Monetización M8 admin gate · Dashboard P1", () => {
  beforeEach(() => {
    useMonetizacionShell.mockReturnValue({
      tenantId: "demo-operator",
      setTenantId: jest.fn(),
      openTrace: jest.fn(),
      closeTrace: jest.fn(),
    });
    useAuth.mockReturnValue({
      activeRole: { role_key: "platform_superadmin", core_name: "platform", display_name: "Super Admin" },
    });
  });

  const wrap = () =>
    render(
      <div className="forge-monetizacion">
        <MonetizacionDashboardClient initialKpis={DASHBOARD_KPIS} drilldowns={DRILLDOWNS} />
      </div>,
    );

  test("platform_superadmin sees god-view KPIs", () => {
    wrap();
    expect(screen.getByText("GMV financiado")).toBeInTheDocument();
    expect(screen.getByText("Tenants · ingreso, costo y margen")).toBeInTheDocument();
  });

  test("tenant_admin role is blocked from god-view", () => {
    useAuth.mockReturnValue({
      activeRole: { role_key: "tenant_admin", core_name: "credit", display_name: "Tenant Admin" },
    });
    wrap();
    expect(screen.getByText(/Vista de operador/)).toBeInTheDocument();
    expect(screen.queryByText("GMV financiado")).not.toBeInTheDocument();
  });

  test("viewer role is blocked from god-view", () => {
    useAuth.mockReturnValue({
      activeRole: { role_key: "credit_admin", core_name: "credit", display_name: "Credit Admin" },
    });
    wrap();
    expect(screen.getByText(/Vista de operador/)).toBeInTheDocument();
    expect(screen.queryByText("GMV financiado")).not.toBeInTheDocument();
  });
});
