import { render, screen } from "@testing-library/react";
import { RiskBand } from "@/components/credit-hub/primitives/RiskBand";

describe("RiskBand", () => {
  test.each([
    ["low", "bajo"],
    ["medium", "medio"],
    ["high", "alto"],
    ["critical", "crítico"],
  ] as const)("renders %s level", (level, label) => {
    render(
      <div className="credit-hub-forge">
        <RiskBand level={level} />
      </div>
    );
    expect(screen.getByText(new RegExp(`Riesgo ${label}`, "i"))).toBeInTheDocument();
  });
});
