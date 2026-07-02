import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DRILLDOWNS, REVENUE_ANALYTICS_MAY_2026 } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionIngresosClient } from "@/app/(forge)/credit-hub/monetizacion/ingresos/MonetizacionIngresosClient";

const mockOpenTrace = jest.fn();

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: jest.fn(),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/ingresos/ingresos-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/screen-states.css", () => ({}));

const { useMonetizacionShell } = jest.requireMock("@/components/credit-hub/monetizacion/shell");
const { useAuth } = jest.requireMock("@/hooks/useAuth");

describe("Monetización M8-P2 Ingresos", () => {
  beforeEach(() => {
    mockOpenTrace.mockClear();
    useMonetizacionShell.mockReturnValue({
      tenantId: "demo-operator",
      setTenantId: jest.fn(),
      openTrace: mockOpenTrace,
      closeTrace: jest.fn(),
    });
    useAuth.mockReturnValue({
      activeRole: { role_key: "platform_superadmin", core_name: "platform", display_name: "Super Admin" },
    });
  });

  const wrap = () =>
    render(
      <div className="forge-monetizacion">
        <MonetizacionIngresosClient revenue={REVENUE_ANALYTICS_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );

  test("platform_superadmin sees revenue KPIs and tenant table", () => {
    wrap();
    expect(screen.getByText("Ingreso total")).toBeInTheDocument();
    expect(screen.getByText("Ingreso por tenant")).toBeInTheDocument();
    expect(screen.getByText("Banco Nacional RD")).toBeInTheDocument();
  });

  test("tenant_admin role is blocked from ingresos", () => {
    useAuth.mockReturnValue({
      activeRole: { role_key: "tenant_admin", core_name: "credit", display_name: "Tenant Admin" },
    });
    wrap();
    expect(screen.getByText(/Vista de operador/)).toBeInTheDocument();
    expect(screen.queryByText("Ingreso por tenant")).not.toBeInTheDocument();
  });

  test("credit_admin role is blocked from ingresos", () => {
    useAuth.mockReturnValue({
      activeRole: { role_key: "credit_admin", core_name: "credit", display_name: "Credit Admin" },
    });
    wrap();
    expect(screen.getByText(/Vista de operador/)).toBeInTheDocument();
  });

  test("GMV KPI opens gmv drilldown", async () => {
    wrap();
    await userEvent.click(screen.getByRole("button", { name: /GMV financiado/ }));
    expect(mockOpenTrace).toHaveBeenCalledWith(
      expect.objectContaining({ drilldown: DRILLDOWNS.gmv, aggFormatted: "RD$ 264.3M" }),
    );
  });
});
