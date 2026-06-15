import { render, screen } from "@testing-library/react";
import { DecisionPanel } from "@/components/credit-hub/primitives/DecisionPanel";

describe("DecisionPanel", () => {
  test("renders idle actions", () => {
    render(
      <div className="credit-hub-forge">
        <DecisionPanel state="idle" />
      </div>
    );
    expect(screen.getByRole("button", { name: /^Aprobar$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Rechazar$/i })).toBeInTheDocument();
    expect(screen.getByText(/Decisión de crédito/i)).toBeInTheDocument();
  });

  test("renders error alert when state is error", () => {
    render(
      <div className="credit-hub-forge">
        <DecisionPanel state="error" />
      </div>
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/Conflicto 409/i);
  });
});
