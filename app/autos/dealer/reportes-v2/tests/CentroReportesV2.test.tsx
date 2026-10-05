import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CentroReportesV2 } from "../CentroReportesV2";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { fetchBalanceComprobacion } from "@/lib/dcc/reportes";
import * as cuadre from "@/lib/contable/cuadre";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/access/hooks", () => ({ useAccessEntitlementsBatch: jest.fn() }));
const branding: Record<string, unknown> = {};
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: branding }),
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
  beforeEach(() => {
    jest.resetAllMocks();
    for (const k of Object.keys(branding)) delete branding[k];
    Object.assign(branding, { display_name: "Mapaal Automotores", locale: "es-AR", currency: "ARS", country_code: "AR" });
  });

  const PERMITIDO = { "accounting.reports.financial": { allowed: true, reason_code: null } };

  it("Mapaal (AR): oculta 606/607 de RD, sin escribir el pais a mano, y no pide datos al entrar", () => {
    montar(PERMITIDO);
    expect(screen.queryByTestId("dcc-reporte-dgii_606")).toBeNull();
    expect(screen.queryByTestId("dcc-reporte-dgii_607")).toBeNull();
    expect(screen.getAllByTestId("dcc-naturaleza")).toHaveLength(8);
    expect(screen.getByTestId("dcc-seccion-contabilidad")).toHaveTextContent("Reportes de Argentina");
    expect(within(screen.getByTestId("dcc-reporte-income_statement")).getByTestId("dcc-naturaleza")).toHaveTextContent("En vivo");
    expect(fetchBalanceComprobacion).not.toHaveBeenCalled();
  });

  it("tenant de RD: los 606/607 si aparecen", () => {
    branding.country_code = "DO";
    montar(PERMITIDO);
    expect(within(screen.getByTestId("dcc-reporte-dgii_606")).getByTestId("dcc-naturaleza")).toHaveTextContent("Guardado");
  });

  it("sin pais configurado se ocultan los reportes fiscales (cerrado ante la duda)", () => {
    delete branding.country_code;
    montar(PERMITIDO);
    expect(screen.queryByTestId("dcc-reporte-dgii_606")).toBeNull();
    expect(screen.getByTestId("dcc-seccion-contabilidad")).toHaveTextContent("País del tenant sin configurar");
  });

  it("'Abrir' solo donde hay pantalla existente de ese reporte", () => {
    montar(PERMITIDO);
    const hrefs = screen.getAllByTestId("dcc-reporte-abrir").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/contable/balance-comprobacion", "/contable/libro-mayor", "/contable/estado-resultados"]);
    expect(within(screen.getByTestId("dcc-reporte-cash_flow")).getByTestId("dcc-sello")).toHaveTextContent("Próximamente");
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
    expect(screen.getByText("Debe y haber cuadran", { exact: false })).toBeInTheDocument();
    const explicar = screen.getByTestId("dcc-explicar-cifra");
    expect(explicar).not.toHaveAttribute("open");
    expect(within(explicar).getByText("1010 Caja")).toBeInTheDocument();
    expect(n(explicar.textContent)).toContain("$ 182.400.000,00");
  });

  it("cuadre con la misma funcion que /contable/balance-comprobacion: 0 = 0 cuadra", async () => {
    const espia = jest.spyOn(cuadre, "evaluaCuadre");
    (fetchBalanceComprobacion as jest.Mock).mockResolvedValue({ totalDebe: 0, totalHaber: 0, cuadra: false, cuentas: [] });
    montar(PERMITIDO);
    fireEvent.click(screen.getByTestId("dcc-ver-totales"));
    await waitFor(() => expect(screen.getByTestId("dcc-balance-totales")).toBeInTheDocument());
    expect(screen.getByText("Debe y haber cuadran", { exact: false })).toBeInTheDocument();
    expect(espia).toHaveBeenCalledWith(0, 0);
    espia.mockRestore();
  });

  it("diferencia real: no cuadra", async () => {
    (fetchBalanceComprobacion as jest.Mock).mockResolvedValue({ totalDebe: 1000, totalHaber: 900, cuadra: true, cuentas: [] });
    montar(PERMITIDO);
    fireEvent.click(screen.getByTestId("dcc-ver-totales"));
    await waitFor(() => expect(screen.getByTestId("dcc-balance-totales")).toBeInTheDocument());
    expect(screen.getByText("Debe y haber no cuadran", { exact: false })).toBeInTheDocument();
  });

  it("sin el entitlement contable del backend, los contables quedan bloqueados", () => {
    montar({ "accounting.reports.financial": { allowed: false, reason_code: "UPGRADE_REQUIRED" } });
    expect(within(screen.getByTestId("dcc-reporte-trial_balance")).getByTestId("dcc-sello")).toHaveAttribute("data-estado", "bloqueado");
    expect(screen.queryByTestId("dcc-ver-totales")).toBeNull();
    expect(within(screen.getByTestId("dcc-reporte-executive_report")).getByTestId("dcc-sello")).toHaveAttribute("data-estado", "no_disponible");
  });
});
