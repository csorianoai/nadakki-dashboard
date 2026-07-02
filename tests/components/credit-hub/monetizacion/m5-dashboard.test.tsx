import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DASHBOARD_KPIS, DRILLDOWNS } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionDashboardClient } from "@/app/(forge)/credit-hub/monetizacion/dashboard/MonetizacionDashboardClient";

const mockOpenTrace = jest.fn();

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: () => ({
    tenantId: "demo-operator",
    setTenantId: jest.fn(),
    openTrace: mockOpenTrace,
    closeTrace: jest.fn(),
  }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    activeRole: { role_key: "platform_superadmin", core_name: "platform", display_name: "Super Admin" },
  }),
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/dashboard/dashboard-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));

describe("Monetización M5 Dashboard", () => {
  beforeEach(() => {
    mockOpenTrace.mockClear();
  });

  const wrap = () =>
    render(
      <div className="forge-monetizacion">
        <MonetizacionDashboardClient initialKpis={DASHBOARD_KPIS} drilldowns={DRILLDOWNS} />
      </div>,
    );

  test("renders alert band and business KPIs", () => {
    wrap();
    expect(screen.getByText("MARGEN BAJO UMBRAL")).toBeInTheDocument();
    expect(screen.getByText("GMV financiado")).toBeInTheDocument();
    expect(screen.getByText("RD$ 78.5M")).toBeInTheDocument();
    expect(screen.getByText("Take rate")).toBeInTheDocument();
  });

  test("renders revenue bars and tenant table", () => {
    wrap();
    expect(screen.getByText("Ingreso por modelo de cobro")).toBeInTheDocument();
    expect(screen.getByText(/RD\$ 1,569,200/)).toBeInTheDocument();
    expect(screen.getByText("Cinta de eventos facturables")).toBeInTheDocument();
    expect(screen.getByText("Banco Atlántico")).toBeInTheDocument();
    expect(screen.getByText("Motores Caribe")).toBeInTheDocument();
  });

  test("business KPI opens trace drawer with drilldown key", async () => {
    wrap();
    await userEvent.click(screen.getByText("MRR"));
    expect(mockOpenTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        title: DRILLDOWNS.mrr.title,
        drilldown: DRILLDOWNS.mrr,
        aggFormatted: "RD$ 1.84M",
      }),
    );
  });

  test("tenant row opens margen drilldown", async () => {
    wrap();
    await userEvent.click(screen.getByText("Banco Atlántico"));
    expect(mockOpenTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        drilldown: DRILLDOWNS.margen,
        aggFormatted: "9%",
      }),
    );
  });
});
