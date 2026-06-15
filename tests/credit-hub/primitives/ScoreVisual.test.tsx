import { render, screen } from "@testing-library/react";
import { ScoreVisual } from "@/components/credit-hub/primitives/ScoreVisual";

describe("ScoreVisual", () => {
  test("renders score with accessible label", () => {
    render(
      <div className="credit-hub-forge">
        <ScoreVisual score={742} />
      </div>
    );
    expect(screen.getByRole("img", { name: /Score 742, riesgo Bajo/i })).toBeInTheDocument();
    expect(screen.getByText("742")).toBeInTheDocument();
    expect(screen.getByText(/Riesgo bajo/i)).toBeInTheDocument();
  });
});
