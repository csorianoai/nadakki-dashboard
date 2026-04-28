import { render, screen } from "@testing-library/react";
import { RecommendationCard } from "@/components/credit-hub/dealer/analysis/RecommendationCard";

describe("RecommendationCard", () => {
  test("renders dynamic recommendation numbers from backend response", () => {
    const { rerender } = render(
      <RecommendationCard
        recommendation={{
          type: "increase_down_payment",
          title: "Aumentar inicial",
          current_value: 100000,
          recommended_value: 180000,
          estimated_new_payment: 28400,
          estimated_new_dti: 0.41,
          estimated_new_score: 745,
          impact: "La cuota entra dentro de la capacidad estimada.",
          explanation: "Aumentar la inicial reduce el monto financiado.",
        }}
      />
    );
    expect(screen.getByText(/RD\$100,000/)).toBeInTheDocument();
    expect(screen.getByText(/RD\$180,000/)).toBeInTheDocument();
    expect(screen.getByText(/RD\$28,400/)).toBeInTheDocument();

    rerender(
      <RecommendationCard
        recommendation={{
          type: "increase_down_payment",
          title: "Aumentar inicial",
          current_value: 125000,
          recommended_value: 220000,
          estimated_new_payment: 25100,
          estimated_new_dti: 0.36,
          estimated_new_score: 782,
          impact: "La cuota entra dentro de la capacidad estimada.",
          explanation: "Aumentar la inicial reduce el monto financiado.",
        }}
      />
    );
    expect(screen.getByText(/RD\$125,000/)).toBeInTheDocument();
    expect(screen.getByText(/RD\$220,000/)).toBeInTheDocument();
    expect(screen.queryByText(/RD\$180,000/)).not.toBeInTheDocument();
  });

  test("formats term extension in months", () => {
    render(
      <RecommendationCard
        recommendation={{
          type: "extend_term",
          title: "Extender plazo",
          current_value: 48,
          recommended_value: 72,
          estimated_new_payment: 21000,
          estimated_new_dti: 0.34,
          estimated_new_score: 720,
          impact: "Reduce la cuota mensual.",
          explanation: "Un plazo mayor distribuye el principal en más meses.",
        }}
      />
    );
    expect(screen.getByText("48 meses")).toBeInTheDocument();
    expect(screen.getByText("72 meses")).toBeInTheDocument();
  });
});
