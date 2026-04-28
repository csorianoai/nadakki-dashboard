import { render, screen } from "@testing-library/react";
import BankApplicationsQueuePage from "@/app/(forge)/credit-hub/bank/applications/page";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";

jest.mock("@/lib/credit-hub/hooks/useBankQueue", () => ({ useBankQueue: jest.fn() }));
jest.mock("@/lib/credit-hub/hooks/useBulkActions", () => ({
  useBulkActions: () => ({ mutateAsync: jest.fn(), isPending: false, data: null }),
}));

describe("Bank queue page", () => {
  test("shows applications ordered by provided score order", () => {
    (useBankQueue as jest.Mock).mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        applications: [
          { application_id: "high", tenant_id: "t", state: "DRAFT", applicant_name: "Alta", dealer_id: null, dealer_name: "Dealer A", vehicle_label: "Toyota", requested_amount: 1, score: 900, risk_level: "BAJO", approval_band: "PREAPROBABLE", priority: "ALTA", created_at: null, bank_decision: null },
          { application_id: "low", tenant_id: "t", state: "DRAFT", applicant_name: "Baja", dealer_id: null, dealer_name: "Dealer B", vehicle_label: "Honda", requested_amount: 1, score: 620, risk_level: "MEDIO", approval_band: "REVISION", priority: "BAJA", created_at: null, bank_decision: null },
        ],
      },
    });
    render(<BankApplicationsQueuePage />);
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();
  });
});
