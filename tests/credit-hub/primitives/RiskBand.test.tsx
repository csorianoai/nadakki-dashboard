import { render, screen } from "@testing-library/react";
import { RiskBand } from "@/components/credit-hub/primitives/RiskBand";

describe("RiskBand", () => {
  test.each([
    ["low", "Bajo"],
    ["medium", "Medio"],
    ["high", "Alto"],
    ["critical", "Crítico"],
  ] as const)("renders %s level", (level, label) => {
    render(
      <div className="credit-hub-forge">
        <RiskBand level={level} />
      </div>
    );
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
