import { render, screen } from "@testing-library/react";
import { NotesPanel } from "@/app/(bank)/bank/applications/[id]/components/NotesPanel";

describe("NotesPanel", () => {
  test("shows empty notes copy", () => {
    render(<NotesPanel notes="" />);
    expect(screen.getByText(/sin notas registradas/i)).toBeInTheDocument();
  });

  test("renders note text with pre-wrap semantics (class)", () => {
    render(<NotesPanel notes={"Line1\nLine2"} />);
    const p = screen.getByText(/Line1/);
    expect(p.className).toMatch(/whitespace-pre-wrap/);
  });
});
