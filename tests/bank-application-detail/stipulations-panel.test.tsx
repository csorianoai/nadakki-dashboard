import { render, screen } from "@testing-library/react";
import { StipulationsPanel } from "@/app/(bank)/bank/applications/[id]/components/StipulationsPanel";

describe("StipulationsPanel", () => {
  test("empty stipulations message", () => {
    render(<StipulationsPanel applicationId="app-x" stipulations={[]} />);
    expect(screen.getByText(/sin estipulaciones activas/i)).toBeInTheDocument();
  });

  test("lists stipulation description and status", () => {
    render(
      <StipulationsPanel
        applicationId="app-x"
        stipulations={[{ id: "s1", description: "Comprobante de ingresos", status: "open" }]}
      />,
    );
    expect(screen.getByText("Comprobante de ingresos")).toBeInTheDocument();
    expect(screen.getByText(/\(open\)/i)).toBeInTheDocument();
  });

  test("links to stipulations admin route", () => {
    render(<StipulationsPanel applicationId="uuid-123" stipulations={[]} />);
    const link = screen.getByRole("link", { name: /gestionar/i });
    expect(link.getAttribute("href")).toContain("/bank/applications/uuid-123/stipulations");
  });
});
