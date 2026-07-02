import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COST_MARGIN_MAY_2026, DRILLDOWNS } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionCostoMargenClient } from "@/app/(forge)/credit-hub/monetizacion/costo-margen/MonetizacionCostoMargenClient";

const mockOpenTrace = jest.fn();

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: jest.fn(),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/costo-margen/costo-margen-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/screen-states.css", () => ({}));

const { useMonetizacionShell } = jest.requireMock("@/components/credit-hub/monetizacion/shell");
const { useAuth } = jest.requireMock("@/hooks/useAuth");

describe("Monetización M8-P3 Costo & margen", () => {
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
        <MonetizacionCostoMargenClient costMargin={COST_MARGIN_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );

  test("platform_superadmin sees cost-margin KPIs and tenant margin table", () => {
    wrap();
    expect(screen.getByText("Margen bruto agregado")).toBeInTheDocument();
    expect(screen.getByText("Costo LLM por core")).toBeInTheDocument();
    expect(screen.getByText("Margen por tenant · semáforo")).toBeInTheDocument();
    expect(screen.getByText("Banco Atlántico")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ajustar cobro →" })).toHaveAttribute(
      "href",
      "/credit-hub/monetizacion/configuracion",
    );
  });

  test("tenant_admin role is blocked from costo-margen", () => {
    useAuth.mockReturnValue({
      activeRole: { role_key: "tenant_admin", core_name: "credit", display_name: "Tenant Admin" },
    });
    wrap();
    expect(screen.getByText(/Vista de operador/)).toBeInTheDocument();
    expect(screen.queryByText("Costo LLM por core")).not.toBeInTheDocument();
  });

  test("credit_admin role is blocked from costo-margen", () => {
    useAuth.mockReturnValue({
      activeRole: { role_key: "credit_admin", core_name: "credit", display_name: "Credit Admin" },
    });
    wrap();
    expect(screen.getByText(/Vista de operador/)).toBeInTheDocument();
  });

  test("margen KPI opens margen drilldown", async () => {
    wrap();
    await userEvent.click(screen.getByRole("button", { name: /Margen bruto agregado/ }));
    expect(mockOpenTrace).toHaveBeenCalledWith(
      expect.objectContaining({ drilldown: DRILLDOWNS.margen, aggFormatted: "61%" }),
    );
  });
});
