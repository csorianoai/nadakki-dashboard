import { render, screen } from "@testing-library/react";
import { BankAnalyticsCharts } from "@/components/credit-hub/bank/BankAnalyticsCharts";
import { BankExecutiveMetrics } from "@/components/credit-hub/bank/BankExecutiveMetrics";

const analytics = {
  applications_by_status: { APROBADO: 2, RECHAZADO: 1 },
  approval_rate: 0.66,
  avg_decision_time_hours: null,
  top_dealers: [],
  portfolio_value: 1800000,
  default_prediction: { rule: "score < 600", predicted_default_count: 1, predicted_default_rate: 0.33 },
  cohort_analysis: [{ period: "2026-04", applications: 3, approved: 2, approval_rate: 0.66 }],
  total_applications: 3,
};

describe("Bank analytics components", () => {
  test("renders executive metrics", () => {
    render(<BankExecutiveMetrics analytics={analytics} />);
    expect(screen.getByText("Solicitudes")).toBeInTheDocument();
    expect(screen.getByText("Aprobación %")).toBeInTheDocument();
    expect(screen.getByText(/RD\$/)).toBeInTheDocument();
  });

  test("renders charts section", () => {
    render(<BankAnalyticsCharts analytics={analytics} />);
    expect(screen.getByText("Solicitudes por status")).toBeInTheDocument();
    expect(screen.getByText("Cohorts por mes")).toBeInTheDocument();
  });
});
