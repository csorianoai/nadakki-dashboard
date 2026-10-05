import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CentroReportesV2 } from "../CentroReportesV2";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { fetchBalanceComprobacion } from "@/lib/dcc/reportes";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/access/hooks", () => ({ useAccessEntitlementsBatch: jest.fn() }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { display_name: "Mapaal Automotores", locale: "es-AR", currency: "ARS" } }),
}));
jest.mock("@/lib/dcc/reportes", () => ({ ...jest.requireActual("@/lib/dcc/reportes"), fetchBalanceComprobacion: jest.fn() }));

const n = (s: string | null) => (s ?? "").replace(/[  ]/g, " ");

function montar(results: Record<string, unknown>) {
  (useAccessEntitlementsBatch as jest.Mock).mockReturnValue({ isPending: false, isLoading: false, isError: false, error: null, data: { results } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CentroReportesV2 />
    </QueryClientProvider>,
  );
}

describe("Centro de Reportes v2", () => {
  beforeEach(() => jest.resetAllMocks());

  it("lista los ReportDefinitions con su naturaleza y no pide datos al entrar", () => {
    montar({ "accounting.reports.financial": { allowed: true, reason_code: null } });
    expect(screen.getAllByTestId("dcc-naturaleza")).toHaveLength(10);
    expect(within(screen.getByTestId("dcc-seccion-contabilidad")).getAllByTestId("dcc-naturaleza")).toHaveLength(9);
    expect(within(screen.getByTestId("dcc-seccion-ejecutivo")).getAllByTestId("dcc-naturaleza")).toHaveLength(1);
    expect(within(screen.getByTestId("dcc-reporte-dgii_606")).getByTestId("dcc-naturaleza")).toHaveTextContent("Guardado");
    expect(within(screen.getByTestId("dcc-reporte-income_statement")).getByTestId("dcc-naturaleza")).toHaveTextContent("En vivo");
    expect(fetchBalanceComprobacion).not.toHaveBeenCalled();
    expect(screen.getAllByTestId("dcc-ver-totales")).toHaveLength(1);
  });

  it("Ver totales trae las cifras del backend y Explicar cifra muestra su desglose", async () => {
    (fetchBalanceComprobacion as jest.Mock).mockResolvedValue({
      totalDebe: 182_400_000,
      totalHaber: 182_400_000,
      cuadra: true,
      cuentas: [{ codigo: "1010", nombre: "Caja", debe: 182_400_000, haber: 0 }],
    });
    montar({ "accounting.reports.financial": { allowed: true, reason_code: null } });
    fireEvent.click(screen.getByTestId("dcc-ver-totales"));
    await waitFor(() => expect(screen.getByTestId("dcc-balance-totales")).toBeInTheDocument());
    expect(n(screen.getByTestId("dcc-balance-totales").textContent)).toContain("$ 182,4 M");
    expect(screen.getByText("Cuadra según el backend", { exact: false })).toBeInTheDocument();
    const explicar = screen.getByTestId("dcc-explicar-cifra");
    expect(explicar).not.toHaveAttribute("open");
    expect(within(explicar).getByText("1010 Caja")).toBeInTheDocument();
    expect(n(explicar.textContent)).toContain("$ 182.400.000,00");
  });

  it("sin el entitlement contable del backend, los contables quedan bloqueados", () => {
    montar({ "accounting.reports.financial": { allowed: false, reason_code: "UPGRADE_REQUIRED" } });
    expect(within(screen.getByTestId("dcc-reporte-trial_balance")).getByTestId("dcc-sello")).toHaveAttribute("data-estado", "bloqueado");
    expect(screen.queryByTestId("dcc-ver-totales")).toBeNull();
    expect(within(screen.getByTestId("dcc-reporte-executive_report")).queryByTestId("dcc-sello")).toBeNull();
  });
});
