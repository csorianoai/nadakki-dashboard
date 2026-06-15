import { render, screen } from "@testing-library/react";
import { DecisionPanel } from "@/components/credit-hub/primitives/DecisionPanel";

describe("DecisionPanel", () => {
  test("renders idle actions", () => {
    render(
      <div className="credit-hub-forge">
        <DecisionPanel state="idle" />
      </div>
    );
    expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeInTheDocument();
  });

  test("renders loading state", () => {
    render(
      <div className="credit-hub-forge">
        <DecisionPanel state="loading" />
      </div>
    );
    expect(screen.getByText(/Registrando decisión/i)).toBeInTheDocument();
  });

  test("renders error state", () => {
    render(
      <div className="credit-hub-forge">
        <DecisionPanel state="error" />
      </div>
    );
    expect(screen.getByText(/No se pudo registrar la decisión/i)).toBeInTheDocument();
  });
});
