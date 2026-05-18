import { render, screen } from "@testing-library/react";
import { ApplicationHeader } from "@/app/(bank)/bank/applications/[id]/components/ApplicationHeader";
import type { BankApplicationDetailResponse } from "@/lib/bank-application-detail/types";

const base = (over?: Partial<BankApplicationDetailResponse>): BankApplicationDetailResponse => ({
  application_id: "uuid-1",
  queue_status: "reviewing",
  borrower_name_masked: "F. *** Last",
  amount: 75000,
  currency: "DOP",
  dealer: { id: "d1", name: "Dealer X", location: "SD" },
  borrower: {},
  vehicle: {},
  scoring: {},
  ...over,
});

describe("ApplicationHeader", () => {
  test("shows masked name, amount, dealer, audit link", () => {
    render(<ApplicationHeader detail={base({ hours_until_sla: 5 })} />);
    expect(screen.getByText("F. *** Last")).toBeInTheDocument();
    expect(screen.getByText(/Dealer X/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /auditoría/i })).toHaveAttribute("href", "/credit-hub/bank/audit");
    expect(screen.getByText(/reviewing/i)).toBeInTheDocument();
  });

  test("SLA badge shows Vencido when hours_until_sla negative", () => {
    render(<ApplicationHeader detail={base({ hours_until_sla: -0.5 })} />);
    expect(screen.getByText(/Vencido/)).toBeInTheDocument();
  });
});
