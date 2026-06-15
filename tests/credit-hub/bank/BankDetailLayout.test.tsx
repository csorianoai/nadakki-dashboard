import { render, screen } from "@testing-library/react";
import { BankDetailLayout } from "@/components/credit-hub/bank/BankDetailLayout";

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "analyst-1" } }),
}));

jest.mock("@/lib/bank-application-detail/claim-application", () => ({
  claimBankApplication: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/credit-hub/hooks/useBankDecision", () => ({
  useBankDecision: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

const application = {
  application_id: "AP-TEST-001",
  tenant_id: "t1",
  state: "claimed",
  application_payload: {
    applicant: { name: "Laura Méndez", full_name: "Laura Méndez" },
    financial: { requested_amount: 250000, term_months: 48, requested_rate: 17.5, down_payment: 50000 },
    vehicle: { label: "Nissan Versa 2024", dealer: "Test Dealer" },
    analysis: {
      score: 720,
      risk_level: "BAJO",
      approval_band: "PREAPROBABLE",
      confidence: 0.9,
      explanation: "Perfil estable.",
      engine: "forge_rule_based_v1",
      positive_factors: [],
      negative_factors: [],
      factors: { positive: [], negative: [] },
      recommendations: [],
      payment_capacity: 10000,
      estimated_payment: 5000,
      financed_amount: 250000,
      dti: 0.3,
      debt_capacity: 8000,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
    documents: [],
  },
};

describe("BankDetailLayout", () => {
  test("renders applicant name and decision panel", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <BankDetailLayout application={application} />
      </div>
    );
    expect(screen.getByRole("heading", { name: /Laura Méndez/i })).toBeInTheDocument();
    expect(screen.getByText(/Decisión de crédito/i)).toBeInTheDocument();
  });
});
