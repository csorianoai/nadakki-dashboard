/**
 * QA Mapaal AR: el balance con debe = haber = 0 decia "NO cuadran", y la
 * pestaña "Estado de Resultados" se cortaba. El veredicto sale ahora de
 * `evaluaCuadre`, la misma funcion que usa el Centro de Reportes v2.
 */
import { render, screen } from "@testing-library/react";
import { getBalanceComprobacion, listPeriodos } from "@/app/hooks/contable";
import { BalanceComprobacionClient } from "@/components/contable/BalanceComprobacionClient";
import { ContableSubNav } from "@/components/contable/ContableSubNav";
import * as cuadre from "@/lib/contable/cuadre";

jest.mock("@/app/hooks/contable", () => ({
  ContableApiError: class extends Error {},
  listPeriodos: jest.fn(),
  getBalanceComprobacion: jest.fn(),
}));
jest.mock("@/components/forge", () => ({ Select: () => null }));
jest.mock("@/components/contable/useContableTenantId", () => ({ useContableTenantId: () => "t-mapaal" }));
jest.mock("@/components/contable/monedaFuncional", () => ({
  useMonedaFuncional: () => "es-AR",
  MonedaFuncionalNota: () => null,
  formateaImporteContable: (v: number) => String(v),
}));
jest.mock("@/components/contable/ContablePageShell", () => ({
  ContablePageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("next/navigation", () => ({ usePathname: () => "/contable/estado-resultados" }));

const periodosMock = listPeriodos as jest.MockedFunction<typeof listPeriodos>;
const balanceMock = getBalanceComprobacion as jest.MockedFunction<typeof getBalanceComprobacion>;

function reporte(total_debe: number, total_haber: number, cuadraBackend: boolean) {
  return {
    periodo_id: "p1",
    fiscal_year: 2026,
    label: "2026-10",
    rows: [],
    totals: { total_debe, total_haber, cuadra: cuadraBackend },
  } as never;
}

describe("Balance de comprobacion: veredicto de cuadre", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    periodosMock.mockResolvedValue([{ id: "p1", label: "2026-10", status: "open" }] as never);
  });

  it("debe = haber = 0 cuadra aunque el flag diga lo contrario", async () => {
    const espia = jest.spyOn(cuadre, "evaluaCuadre");
    balanceMock.mockResolvedValue(reporte(0, 0, false));
    render(<BalanceComprobacionClient />);
    expect(await screen.findByTestId("balance-veredicto")).toHaveTextContent("Totales globales CUADRAN");
    expect(espia).toHaveBeenCalledWith(0, 0);
    espia.mockRestore();
  });

  it("diferencia de centavos por redondeo cuadra", async () => {
    balanceMock.mockResolvedValue(reporte(1000.1 + 0.2, 1000.3, false));
    render(<BalanceComprobacionClient />);
    expect(await screen.findByTestId("balance-veredicto")).toHaveTextContent("Totales globales CUADRAN");
  });

  it("diferencia real no cuadra", async () => {
    balanceMock.mockResolvedValue(reporte(1000, 900, true));
    render(<BalanceComprobacionClient />);
    expect(await screen.findByTestId("balance-veredicto")).toHaveTextContent("Totales globales NO cuadran");
  });
});

describe("Pestañas de contabilidad", () => {
  it("'Estado de Resultados' se muestra completo, sin cortar", () => {
    render(<ContableSubNav />);
    const etiqueta = screen.getByText("Estado de Resultados");
    const pestana = etiqueta.closest("a")!;
    expect(pestana).toHaveAttribute("href", "/contable/estado-resultados");
    expect(pestana.className).toContain("whitespace-nowrap");
    expect(pestana.className).toContain("shrink-0");
    expect(pestana.className).not.toContain("truncate");
    expect(screen.getByRole("navigation").className).toContain("overflow-x-auto");
  });
});
