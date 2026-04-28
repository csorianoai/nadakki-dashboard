import { render, screen } from "@testing-library/react";
import { BankQueueList } from "@/components/credit-hub/bank/BankQueueList";

jest.mock("@/lib/credit-hub/hooks/useBulkActions", () => ({
  useBulkActions: () => ({ mutateAsync: jest.fn(), isPending: false, data: null }),
}));

describe("Bank Portal multi-tenant UI", () => {
  test("renders only applications provided by tenant-scoped hook", () => {
    render(
      <BankQueueList
        applications={[
          { application_id: "tenant-a-app", tenant_id: "tenant-a", state: "DRAFT", applicant_name: "Cliente A", dealer_id: null, dealer_name: "Dealer A", vehicle_label: "Toyota", requested_amount: 1, score: 850, risk_level: "BAJO", approval_band: "PREAPROBABLE", priority: "ALTA", created_at: null, bank_decision: null },
        ]}
      />
    );
    expect(screen.getByText("Cliente A")).toBeInTheDocument();
    expect(screen.queryByText("Cliente B")).not.toBeInTheDocument();
  });
});
