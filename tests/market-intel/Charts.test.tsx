import { render } from "@testing-library/react";
import { Donut, HBar } from "@/app/market-intel/components/Charts";

describe("MEE Charts", () => {
  it("HBar renderiza SVG role img con aria-label", () => {
    const { container } = render(
      <HBar
        data={[
          { label: "Bank A", value: 100, pct: 50, color: "var(--mee-tier1)" },
        ]}
        cur="RD$"
      />,
    );
    expect(container.querySelector('[aria-label="Ranking de instituciones por cartera"]')).toBeTruthy();
  });

  it("Donut renderiza SVG con aria-label", () => {
    const { container } = render(
      <Donut
        data={[
          { label: "Tier 1", value: 40, color: "var(--mee-tier1)" },
          { label: "Tier 2", value: 60, color: "var(--mee-tier2)" },
        ]}
        centerValue="40%"
        centerLabel="Top 4"
      />,
    );
    expect(container.querySelector('[aria-label="Distribución porcentual"]')).toBeTruthy();
  });
});
