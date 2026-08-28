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

  test("declares score and risk unavailable when backend returns null", () => {
    render(<ScoreVisual score={null} />);

    expect(screen.getByRole("img", { name: "Score no disponible" })).toBeInTheDocument();
    expect(screen.getByText("Sin score")).toBeInTheDocument();
    expect(screen.getByText("Riesgo no disponible")).toBeInTheDocument();
    expect(screen.queryByText("720")).not.toBeInTheDocument();
    expect(screen.queryByText(/Riesgo bajo/i)).not.toBeInTheDocument();
  });

  test("declares score unavailable when the field is absent", () => {
    render(<ScoreVisual />);

    expect(screen.getByText("Sin score")).toBeInTheDocument();
    expect(screen.queryByText("720")).not.toBeInTheDocument();
  });
});
