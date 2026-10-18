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
    (useBankAnalytics as jest.Mock).mockReturnValue({ data: { applications_by_status: {}, approval_rate: 0, portfolio_value: 0, total_applications: 0, avg_decision_time_hours: null, default_prediction: { rule: "score < 600", predicted_default_count: 0, predicted_default_rate: 0 }, cohort_analysis: [], top_dealers: [] }, isLoading: false });
    (useBankDealersRanking as jest.Mock).mockReturnValue({ data: { dealers: [] } });
    (useBankPortfolioHealth as jest.Mock).mockReturnValue({ data: { score_distribution: {} } });
    render(<BankAnalyticsPage />);
    expect(screen.getByTestId("bank-analytics-executive")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Cartera ejecutiva" })).toBeInTheDocument();
    expect(screen.getByText("Analytics & Intelligence Executive")).toBeInTheDocument();
    expect(screen.getByText(/0 solicitudes · motor score < 600/)).toBeInTheDocument();
    expect(screen.getByText("Default predicho")).toBeInTheDocument();
  });
});
