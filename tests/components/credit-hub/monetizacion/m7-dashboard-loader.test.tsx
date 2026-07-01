import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DASHBOARD_KPIS, DRILLDOWNS } from "@/lib/credit-hub/monetizacion/fixtures";
import { MonetizacionDashboardLoader } from "@/app/(forge)/credit-hub/monetizacion/dashboard/MonetizacionDashboardLoader";

jest.mock("@/components/credit-hub/monetizacion/shell", () => ({
  useMonetizacionShell: () => ({
    tenantId: "nadakki-operador",
    setTenantId: jest.fn(),
    openTrace: jest.fn(),
    closeTrace: jest.fn(),
  }),
}));

jest.mock("@/app/(forge)/credit-hub/monetizacion/dashboard/dashboard-screen.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));
jest.mock("@/components/credit-hub/monetizacion/ui/screen-states.css", () => ({}));

describe("Monetización M7 dashboard loader", () => {
  test("renders dashboard with SSR initial data", () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionDashboardLoader initial={{ kpis: DASHBOARD_KPIS, drilldowns: DRILLDOWNS }} />
      </div>,
    );
    expect(screen.getByText("GMV financiado")).toBeInTheDocument();
  });

  test("shows error state when fetch fails", async () => {
    const adapter = require("@/lib/credit-hub/monetizacion/adapter");
    jest.spyOn(adapter, "fetchDashboardKpis").mockRejectedValueOnce(new Error("fallo de red"));
    jest.spyOn(adapter, "fetchDrilldowns").mockRejectedValueOnce(new Error("fallo de red"));

    render(
      <div className="forge-monetizacion">
        <MonetizacionDashboardLoader />
      </div>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron leer los eventos de origen.");
  });
});
