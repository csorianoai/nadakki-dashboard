import { render, screen } from "@testing-library/react";
import BankAnalyticsPage from "@/app/(forge)/credit-hub/bank/analytics/page";
import { useBankAnalytics, useBankDealersRanking, useBankPortfolioHealth } from "@/lib/credit-hub/hooks/useBankAnalytics";

jest.mock("@/lib/credit-hub/hooks/useBankAnalytics", () => ({
  useBankAnalytics: jest.fn(),
  useBankDealersRanking: jest.fn(),
  useBankPortfolioHealth: jest.fn(),
}));

describe("Bank analytics page", () => {
  test("renders analytics dashboard", () => {
    (useBankAnalytics as jest.Mock).mockReturnValue({ data: { applications_by_status: {}, approval_rate: 0, portfolio_value: 0, total_applications: 0, cohort_analysis: [], top_dealers: [] }, isLoading: false });
    (useBankDealersRanking as jest.Mock).mockReturnValue({ data: { dealers: [] } });
    (useBankPortfolioHealth as jest.Mock).mockReturnValue({ data: { score_distribution: {} } });
    render(<BankAnalyticsPage />);
    expect(screen.getByText(/Analítica ejecutiva/)).toBeInTheDocument();
    expect(screen.getByText(/Riesgo, ROI y dealers/)).toBeInTheDocument();
  });
});
