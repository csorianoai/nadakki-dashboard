import { render, screen } from "@testing-library/react";
import { BankAnalyticsView } from "@/components/credit-hub/bank/BankAnalyticsView";

const analytics = {
  applications_by_status: { submitted: 10 },
  approval_rate: 0.68,
  avg_decision_time_hours: 4.2,
  top_dealers: [{ dealer: "Dealer A", volume: 1000000, approved: 10, approval_rate: 0.7 }],
  portfolio_value: 10000000,
  default_prediction: { rule: "forge_rule_based_v1", predicted_default_count: 2, predicted_default_rate: 0.04 },
  cohort_analysis: [{ period: "2026-06", applications: 100, approved: 70, approval_rate: 0.7 }],
  total_applications: 100,
};

describe("BankAnalyticsView", () => {
  test("renders portfolio heading", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <BankAnalyticsView analytics={analytics} portfolioHealth={{ score_distribution: { "740-799": 10 } }} />
      </div>
    );
    expect(screen.getByRole("heading", { name: /Cartera ejecutiva/i })).toBeInTheDocument();
    expect(screen.getByText("4.2")).toBeInTheDocument();
  });

  test("muestra badge extremo cuando default rate es 100%", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <BankAnalyticsView
          analytics={{
            ...analytics,
            default_prediction: { rule: "score < 600", predicted_default_count: 500, predicted_default_rate: 1 },
            total_applications: 500,
          }}
          portfolioHealth={{ score_distribution: { "740-799": 10 } }}
        />
      </div>
    );
    expect(screen.getByText("100.0")).toBeInTheDocument();
    expect(screen.getByText("Extremo")).toHaveAttribute("title", expect.stringMatching(/Predicción extrema/i));
  });
});
