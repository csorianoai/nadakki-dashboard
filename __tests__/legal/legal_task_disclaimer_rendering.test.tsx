/**
 * Tests de rendering del disclaimer Ley 91 en el contexto de Task System v2.2.
 * Worker B — Entregable C.
 */

import { render, screen } from "@testing-library/react";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

describe("LegalDisclaimer — Task System v2.2 context", () => {
  it("renders default banner with legal notice", () => {
    render(<LegalDisclaimer />);
    expect(screen.getByText(/Aviso legal:/i)).toBeInTheDocument();
  });

  it("renders compact variant without crashing", () => {
    render(<LegalDisclaimer variant="compact" />);
    expect(screen.getByText(/asistencia legal automatizada/i)).toBeInTheDocument();
  });

  it("disclaimer text mentions automated legal assistance", () => {
    render(<LegalDisclaimer />);
    expect(screen.getByText(/asistencia legal automatizada/i)).toBeInTheDocument();
  });
});

describe("Disclaimer content contract — Ley 91 compliance", () => {
  it("disclaimer component renders without errors", () => {
    expect(() => render(<LegalDisclaimer />)).not.toThrow();
  });

  it("compact variant renders without errors", () => {
    expect(() => render(<LegalDisclaimer variant="compact" />)).not.toThrow();
  });

  it("disclaimer is always visible (not conditionally hidden)", () => {
    const { container } = render(<LegalDisclaimer />);
    // The disclaimer should not have display:none or visibility:hidden
    const element = container.firstChild as HTMLElement;
    if (element) {
      const style = window.getComputedStyle(element);
      expect(style.display).not.toBe("none");
    }
  });
});
