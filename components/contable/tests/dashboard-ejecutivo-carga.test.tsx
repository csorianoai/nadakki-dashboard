/**
 * PS-5: /contable/ejecutivo mostraba un spinner infinito con periodos vacios y
 * se quedaba mudo si /periodos fallaba. Tres casos: vacia, valida, fallo.
 */
import { render, screen, waitFor } from "@testing-library/react";
import {
  getEstadoResultados,
  getGastosMonitor,
  getSituacionFinanciera,
  getSugerenciasAgente,
  listPeriodos,
} from "@/app/hooks/contable";
import { DashboardEjecutivoClient } from "@/components/contable/DashboardEjecutivoClient";

jest.mock("@/app/hooks/contable", () => ({
  ContableApiError: class extends Error {},
  listPeriodos: jest.fn(),
  getEstadoResultados: jest.fn(),
  getSituacionFinanciera: jest.fn(),
  getGastosMonitor: jest.fn(),
  getSugerenciasAgente: jest.fn(),
}));
jest.mock("@/components/forge", () => ({
  Select: () => null,
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));
jest.mock("@/components/ui/GlassCard", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("recharts", () => {
  const Nada = () => null;
  return new Proxy({}, { get: () => Nada });
});
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("@/components/contable/useContableTenantId", () => ({ useContableTenantId: () => "t-qa" }));
jest.mock("@/components/contable/monedaFuncional", () => ({
  useMonedaFuncional: () => ({ locale: "es-AR", currency: "ARS" }),
  MonedaFuncionalNota: () => null,
  formateaImporteContable: (v: number) => String(v),
}));

const periodos = listPeriodos as jest.Mock;

describe("Dashboard ejecutivo: carga", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSugerenciasAgente as jest.Mock).mockRejectedValue(new Error("x"));
  });

  it("periodos vacios: estado vacio explicito, sin spinner", async () => {
    periodos.mockResolvedValue([]);
    render(<DashboardEjecutivoClient />);
    expect(await screen.findByText("Sin datos financieros todavía")).toBeInTheDocument();
    expect(screen.queryByText(/Cargando dashboard/)).not.toBeInTheDocument();
  });

  it("respuesta valida: pinta los KPI", async () => {
    periodos.mockResolvedValue([
      { id: "p1", label: "2026-10", status: "open", fecha_inicio: "2026-10-01", fecha_fin: "2026-10-31" },
    ]);
    (getEstadoResultados as jest.Mock).mockResolvedValue({
      total_ingresos: 100, total_costos: 40, total_gastos: 10, utilidad_neta: 50, margen_neto_pct: 50, gastos: [],
    });
    (getSituacionFinanciera as jest.Mock).mockResolvedValue(null);
    (getGastosMonitor as jest.Mock).mockResolvedValue(null);
    render(<DashboardEjecutivoClient />);
    expect(await screen.findByText("Utilidad Neta")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Cargando dashboard/)).not.toBeInTheDocument());
    expect(screen.queryByTestId("contable-error-reintentar")).not.toBeInTheDocument();
  });

  it("/periodos falla: mensaje con accion, sin volcar el error crudo", async () => {
    periodos.mockRejectedValue(new Error("boom stack trace SQLSTATE"));
    render(<DashboardEjecutivoClient />);
    expect(await screen.findByTestId("contable-error-reintentar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cargando dashboard/)).not.toBeInTheDocument();
  });

  it("los tres reportes fallan: mensaje con accion, no ceros", async () => {
    periodos.mockResolvedValue([
      { id: "p1", label: "2026-10", status: "open", fecha_inicio: "2026-10-01", fecha_fin: "2026-10-31" },
    ]);
    for (const f of [getEstadoResultados, getSituacionFinanciera, getGastosMonitor]) {
      (f as jest.Mock).mockRejectedValue(new Error("500 SQLSTATE"));
    }
    render(<DashboardEjecutivoClient />);
    expect(await screen.findByTestId("contable-error-reintentar")).toBeInTheDocument();
    expect(screen.queryByText('Utilidad Neta')).not.toBeInTheDocument();
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
  });
});
