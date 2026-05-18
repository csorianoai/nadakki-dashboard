import { render, screen } from "@testing-library/react";
import { StipulationsPanel } from "@/app/(bank)/bank/applications/[id]/components/StipulationsPanel";

describe("StipulationsPanel", () => {
  test("empty stipulations message", () => {
    render(<StipulationsPanel stipulations={[]} />);
    expect(screen.getByText(/sin estipulaciones activas/i)).toBeInTheDocument();
  });

  test("lists stipulation description and status", () => {
    render(
      <StipulationsPanel
        stipulations={[{ id: "s1", description: "Comprobante de ingresos", status: "open" }]}
      />,
    );
    expect(screen.getByText("Comprobante de ingresos")).toBeInTheDocument();
    expect(screen.getByText(/\(open\)/i)).toBeInTheDocument();
  });
});
