import { render, screen } from "@testing-library/react";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

describe("LegalDisclaimer", () => {
  it("renders banner variant with aviso legal", () => {
    render(<LegalDisclaimer />);
    expect(screen.getByText(/Aviso legal:/)).toBeInTheDocument();
    expect(
      screen.getByText(/asistencia legal automatizada/i)
    ).toBeInTheDocument();
  });

  it("renders compact variant", () => {
    render(<LegalDisclaimer variant="compact" />);
    expect(screen.getByText(/asistencia legal automatizada/i)).toBeInTheDocument();
  });
});
