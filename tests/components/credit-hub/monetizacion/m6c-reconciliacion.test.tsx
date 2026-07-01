import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DRILLDOWNS, RECONCILIATION_MAY_2026 } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionReconciliacionClient } from "@/app/(forge)/credit-hub/monetizacion/reconciliacion/MonetizacionReconciliacionClient";

const mockOpenTrace = jest.fn();

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: () => ({
    tenantId: "banco-cibao",
    setTenantId: jest.fn(),
    openTrace: mockOpenTrace,
    closeTrace: jest.fn(),
  }),
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/reconciliacion/reconciliacion-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));

describe("Monetización M6c-P8 Reconciliación", () => {
  beforeEach(() => mockOpenTrace.mockClear());

  test("renders reconciliation KPIs with zero discrepancy", () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionReconciliacionClient reconciliation={RECONCILIATION_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );
    expect(screen.getByText("✓ 0 discrepancias")).toBeInTheDocument();
    expect(screen.getByText(/391,900/)).toBeInTheDocument();
    expect(screen.getByText(/15,732/)).toBeInTheDocument();
  });

  test("match row opens trace drawer", async () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionReconciliacionClient reconciliation={RECONCILIATION_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );
    await userEvent.click(screen.getByText("AI metered"));
    expect(mockOpenTrace).toHaveBeenCalledWith(
      expect.objectContaining({ drilldown: DRILLDOWNS.ai, aggFormatted: "RD$ 59,400.00" }),
    );
  });

  test("ledger shows sealed hashes", () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionReconciliacionClient reconciliation={RECONCILIATION_MAY_2026} drilldowns={DRILLDOWNS} />
      </div>,
    );
    expect(screen.getByText(/0x1c2f…a9/)).toBeInTheDocument();
    expect(screen.getByText("DEAL-7790")).toBeInTheDocument();
  });
});
