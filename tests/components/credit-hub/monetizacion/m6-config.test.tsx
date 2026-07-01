import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BILLING_CONFIG_DEFAULT } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionConfigClient } from "@/app/(forge)/credit-hub/monetizacion/configuracion/MonetizacionConfigClient";

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: () => ({
    tenantId: "banco-cibao",
    setTenantId: jest.fn(),
    openTrace: jest.fn(),
    closeTrace: jest.fn(),
  }),
  DEMO_TENANTS: [
    { id: "banco-cibao", label: "Banco del Cibao", subtitle: "Banco · Híbrido (B2)", initials: "BC", accent: "#2bd073" },
  ],
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/configuracion/config-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-controls.css", () => ({}));

describe("Monetización M6a Config", () => {
  const wrap = () =>
    render(
      <div className="forge-monetizacion">
        <MonetizacionConfigClient initialConfig={BILLING_CONFIG_DEFAULT} />
      </div>,
    );

  test("renders bank models and live what-if anchor total", () => {
    wrap();
    expect(screen.getByText(/Configuración de cobro · Banco del Cibao/)).toBeInTheDocument();
    expect(screen.getByText("ANCLA")).toBeInTheDocument();
    expect(screen.getByText(/462,442/)).toBeInTheDocument();
  });

  test("what-if recalculates when bps changes", async () => {
    wrap();
    const plus = screen.getByRole("button", { name: "Aumentar bps" });
    await userEvent.click(plus);
    expect(screen.queryByText(/462,442/)).not.toBeInTheDocument();
  });

  test("dealer tab shows Pro plan", async () => {
    wrap();
    await userEvent.click(screen.getByRole("tab", { name: "Planes de dealer" }));
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText(/RD\$ 18,000/)).toBeInTheDocument();
  });
});
