import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BankDetailLayout } from "@/components/credit-hub/bank/BankDetailLayout";

jest.mock("next/font/google", () => ({
  Inter: () => ({ className: "", variable: "" }),
  JetBrains_Mono: () => ({ className: "", variable: "" }),
  Source_Serif_4: () => ({ className: "", variable: "" }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "analyst-1" }, activeRole: { role_key: "bank_analyst" } }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditHubActor", () => ({
  useCreditHubActor: () => ({ roleKey: "bank_analyst", can: () => true }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ apiTenantId: "t1", tenantId: "t1", loading: false }),
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
    bank_claim: { analyst_id: "analyst-1", current_user_owns: true, lender_code: "pilot" },
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
  const renderLayout = (value: typeof application) =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <div className="credit-hub-forge" data-persona="bank">
          <BankDetailLayout application={value} />
        </div>
      </QueryClientProvider>
    );

  test("renders applicant name and decision panel", () => {
    renderLayout(application);
    expect(screen.getByRole("heading", { name: /Laura Méndez/i })).toBeInTheDocument();
    expect(screen.getByText(/Decisión de crédito/i)).toBeInTheDocument();
  });

  test("does not invent score or risk when analysis values are absent", () => {
    const absentAnalysis = {
      ...application,
      application_payload: {
        ...application.application_payload,
        analysis: { ...application.application_payload.analysis, score: null, risk_level: null },
      },
    };
    renderLayout(absentAnalysis);

    expect(screen.getByText("Sin score")).toBeInTheDocument();
    expect(screen.getByText("Riesgo no disponible")).toBeInTheDocument();
    expect(screen.queryByText("720")).not.toBeInTheDocument();
    expect(screen.queryByText(/Riesgo bajo/i)).not.toBeInTheDocument();
  });

  test("keeps decision controls blocked without an owned claim", () => {
    renderLayout({
      ...application,
      application_payload: { ...application.application_payload, bank_claim: null },
    });

    expect(screen.getByTestId("decision-panel-forbidden")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aprobar solicitud/i })).toBeDisabled();
    expect(screen.getByLabelText("Monto aprobado")).toHaveAttribute("readonly");
    // BANK-V2-03: dice la causa real (no el rol) y ofrece asignarse.
    expect(screen.getByTestId("decision-panel-forbidden")).toHaveTextContent("no está asignada a ti");
    expect(screen.getByTestId("decision-panel-forbidden")).not.toHaveTextContent("Tu rol");
    expect(screen.getByRole("button", { name: "Asignarme" })).toBeInTheDocument();
  });

  test("keeps controls blocked for another analyst in the same tenant", () => {
    renderLayout({
      ...application,
      tenant_id: "t1",
      application_payload: {
        ...application.application_payload,
        bank_claim: { analyst_id: "analyst-2", current_user_owns: false, lender_code: "pilot" },
      },
    });

    expect(screen.getByTestId("decision-panel-forbidden")).toBeInTheDocument();
    expect(screen.getByLabelText("Monto aprobado")).toHaveAttribute("readonly");
    expect(screen.getByTestId("decision-panel-forbidden")).toHaveTextContent("no está asignada a ti");
    expect(screen.queryByRole("button", { name: "Asignarme" })).toBeNull();
  });

  test("enables decision controls for the analyst who owns the claim", () => {
    renderLayout(application);

    expect(screen.queryByTestId("decision-panel-forbidden")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Monto aprobado")).not.toHaveAttribute("readonly");
  });
});
