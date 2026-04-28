import { fireEvent, render, screen } from "@testing-library/react";
import { CreditAnalysisPanel } from "@/components/credit-hub/dealer/analysis/CreditAnalysisPanel";
import { useCreditAnalysis } from "@/lib/credit-hub/hooks/useCreditAnalysis";

jest.mock("@/lib/credit-hub/hooks/useCreditAnalysis", () => ({
  useCreditAnalysis: jest.fn(),
}));

const mutate = jest.fn();
const mockUseCreditAnalysis = useCreditAnalysis as jest.Mock;

const analysis = {
  score: 745,
  risk_level: "MEDIO_BAJO",
  approval_band: "PREAPROBABLE",
  payment_capacity: 42000,
  estimated_payment: 31000,
  financed_amount: 900000,
  dti: 0.38,
  debt_capacity: 32000,
  factors: { positive: ["Cuota viable"], negative: ["Documentación pendiente"] },
  positive_factors: ["Cuota viable"],
  negative_factors: ["Documentación pendiente"],
  recommendations: [
    {
      type: "increase_down_payment",
      title: "Aumentar inicial",
      current_value: 100000,
      recommended_value: 180000,
      estimated_new_payment: 28400,
      estimated_new_dti: 0.41,
      estimated_new_score: 785,
      impact: "La cuota entra dentro de la capacidad estimada.",
      explanation: "Aumentar la inicial reduce el monto financiado.",
    },
  ],
  explanation: "La cuota estimada entra dentro de la capacidad.",
  confidence: 0.88,
  timestamp: "2026-04-27T20:00:00Z",
  version: "1.0.0",
  engine: "forge_rule_based_v1",
};

describe("CreditAnalysisPanel", () => {
  beforeEach(() => {
    mutate.mockReset();
    mockUseCreditAnalysis.mockReset();
  });

  test("shows score and capacity versus payment", () => {
    mockUseCreditAnalysis.mockReturnValue({ data: analysis, isLoading: false, isAnalyzing: false, error: null, mutate });
    render(<CreditAnalysisPanel applicationId="app-1" />);
    expect(screen.getByText("745")).toBeInTheDocument();
    expect(screen.getByText(/Capacidad estimada/)).toBeInTheDocument();
    expect(screen.getByText(/Cuota estimada/)).toBeInTheDocument();
    expect(screen.getByText(/38%/)).toBeInTheDocument();
  });

  test("button triggers analyze mutation", () => {
    mockUseCreditAnalysis.mockReturnValue({ data: null, isLoading: false, isAnalyzing: false, error: null, mutate });
    render(<CreditAnalysisPanel applicationId="app-1" />);
    fireEvent.click(screen.getByRole("button", { name: /Ejecutar análisis crediticio/ }));
    expect(mutate).toHaveBeenCalled();
  });

  test("shows loading state in Spanish", () => {
    mockUseCreditAnalysis.mockReturnValue({ data: null, isLoading: false, isAnalyzing: true, error: null, mutate });
    render(<CreditAnalysisPanel applicationId="app-1" />);
    expect(screen.getAllByText(/Ejecutando análisis crediticio/).length).toBeGreaterThan(0);
  });

  test("shows clear error state", () => {
    mockUseCreditAnalysis.mockReturnValue({ data: null, isLoading: false, isAnalyzing: false, error: new Error("Fallo backend"), mutate });
    render(<CreditAnalysisPanel applicationId="app-1" />);
    expect(screen.getByText(/No se pudo completar el análisis/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reintentar/ })).toBeInTheDocument();
  });

  test("empty state does not show fixed mock score", () => {
    mockUseCreditAnalysis.mockReturnValue({ data: null, isLoading: false, isAnalyzing: false, error: null, mutate });
    render(<CreditAnalysisPanel applicationId="app-1" />);
    expect(screen.getByText(/Aún no se ha ejecutado análisis/)).toBeInTheDocument();
    expect(screen.queryByText("745")).not.toBeInTheDocument();
  });
});
