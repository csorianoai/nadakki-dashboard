import { render, screen } from "@testing-library/react";
import BankDashboardPage from "@/app/(forge)/credit-hub/bank/page";
import { useBankAnalytics } from "@/lib/credit-hub/hooks/useBankAnalytics";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";

jest.mock("@/lib/credit-hub/hooks/useBankAnalytics", () => ({ useBankAnalytics: jest.fn() }));
jest.mock("@/lib/credit-hub/hooks/useBankQueue", () => ({ useBankQueue: jest.fn() }));
jest.mock("@/lib/credit-hub/hooks/useBulkActions", () => ({
  useBulkActions: () => ({ mutateAsync: jest.fn(), isPending: false, data: null }),
}));

describe("Bank dashboard page", () => {
  test("renders executive dashboard and queue", () => {
    (useBankAnalytics as jest.Mock).mockReturnValue({ data: { applications_by_status: {}, approval_rate: 0, portfolio_value: 0, total_applications: 0 }, isLoading: false });
    (useBankQueue as jest.Mock).mockReturnValue({ data: { applications: [] }, isLoading: false, error: null });
    render(<BankDashboardPage />);
    expect(screen.getByText(/Mesa de decisiones CrediCefi/)).toBeInTheDocument();
    expect(screen.getAllByText(/Bandeja priorizada/).length).toBeGreaterThan(0);
  });
});
