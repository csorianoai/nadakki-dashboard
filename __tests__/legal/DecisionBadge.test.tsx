import { render, screen } from "@testing-library/react";
import { DecisionBadge } from "@/components/legal/DecisionBadge";
import type { DecisionBlock } from "@/lib/legal-api";

describe("DecisionBadge", () => {
  it("renders revision with confidence", () => {
    const d: DecisionBlock = {
      accion: "revision",
      prioridad: "media",
      confianza: 0.42,
      explicacion: "x",
      siguientes_pasos: [],
    };
    render(<DecisionBadge decision={d} />);
    expect(screen.getByText(/Requiere revisión/)).toBeInTheDocument();
    expect(screen.getByText(/42%/)).toBeInTheDocument();
  });
});
