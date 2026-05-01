import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BankDecisionPanel } from "@/components/credit-hub/bank/BankDecisionPanel";
import { useBankCounterOffer, useBankDecision } from "@/lib/credit-hub/hooks/useBankDecision";

jest.mock("@/lib/credit-hub/hooks/useBankDecision", () => ({
  useBankDecision: jest.fn(),
  useBankCounterOffer: jest.fn(),
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({ tenantConfig: { locale: "es-DO" }, loading: false }),
}));

const mutateAsync = jest.fn();

const application = {
  application_id: "app-1",
  tenant_id: "tenant-a",
  state: "DRAFT",
  application_payload: {
    analysis: {
      score: 825,
      financed_amount: 900000,
      metrics: { annual_rate: 18, term_months: 60, down_payment: 300000 },
    },
  },
};

describe("BankDecisionPanel", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    (useBankDecision as jest.Mock).mockReturnValue({ mutateAsync, isPending: false });
    (useBankCounterOffer as jest.Mock).mockReturnValue({ data: undefined });
  });

  test("requires justification before confirming", () => {
    render(<BankDecisionPanel application={application as never} />);
    expect(screen.getByRole("button", { name: /Confirmar decisión/ })).toBeDisabled();
  });

  test("submits approval decision with justification", async () => {
    mutateAsync.mockResolvedValue({ decision: "APROBADO" });
    render(<BankDecisionPanel application={application as never} />);
    fireEvent.change(screen.getByPlaceholderText(/Explica la razón/), {
      target: { value: "Score alto y documentación completa para aprobación." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirmar decisión/ }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({ decision: "APROBADO" });
  });
});
