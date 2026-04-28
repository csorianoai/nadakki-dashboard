import { fireEvent, render, screen } from "@testing-library/react";
import DealerApplicationDetailPage from "@/app/(forge)/credit-hub/dealer/applications/[applicationId]/page";
import { useCreditApplicationDetail } from "@/lib/credit-hub/hooks/useCreditApplicationDetail";
import { useCreditAnalysis } from "@/lib/credit-hub/hooks/useCreditAnalysis";
import { useProcessCreditApplication } from "@/lib/credit-hub/hooks/useProcessCreditApplication";
import { makeApplication } from "../testData";

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    use: (value: unknown) => value,
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditApplicationDetail", () => ({
  useCreditApplicationDetail: jest.fn(),
}));

jest.mock("@/lib/credit-hub/hooks/useProcessCreditApplication", () => ({
  useProcessCreditApplication: jest.fn(),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditAnalysis", () => ({
  useCreditAnalysis: jest.fn(),
}));

const mockUseApplication = useCreditApplicationDetail as jest.Mock;
const mockUseProcess = useProcessCreditApplication as jest.Mock;
const mockUseAnalysis = useCreditAnalysis as jest.Mock;

describe("DealerApplicationDetailPage analysis tab", () => {
  beforeEach(() => {
    mockUseApplication.mockReturnValue({
      application: makeApplication({ application_id: "app-1" }),
      events: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseProcess.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    mockUseAnalysis.mockReturnValue({
      data: {
        score: 812,
        risk_level: "BAJO",
        approval_band: "PREAPROBABLE",
        payment_capacity: 50000,
        estimated_payment: 30000,
        financed_amount: 800000,
        dti: 0.32,
        debt_capacity: 40000,
        factors: { positive: ["Cuota viable"], negative: [] },
        positive_factors: ["Cuota viable"],
        negative_factors: [],
        recommendations: [],
        explanation: "Operación viable según reglas actuales.",
        confidence: 0.9,
        timestamp: "2026-04-27T20:00:00Z",
        version: "1.0.0",
        engine: "forge_rule_based_v1",
      },
      isLoading: false,
      isAnalyzing: false,
      error: null,
      mutate: jest.fn(),
    });
  });

  test("opens analysis tab and shows backend analysis panel", () => {
    render(<DealerApplicationDetailPage params={{ applicationId: "app-1" } as never} />);
    fireEvent.click(screen.getByRole("button", { name: /Análisis/ }));
    expect(screen.getByText("Puntaje del motor analítico")).toBeInTheDocument();
    expect(screen.getByText("812")).toBeInTheDocument();
    expect(screen.getByText(/Este análisis es orientativo y auditable/)).toBeInTheDocument();
  });
});
