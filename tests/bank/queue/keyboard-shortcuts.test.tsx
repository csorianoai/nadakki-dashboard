/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { KeyboardShortcutsModal } from "@/app/(bank)/bank/applications/queue/components/KeyboardShortcutsModal";

describe("KeyboardShortcutsModal", () => {
  it("lists navigation shortcuts when open", () => {
    render(<KeyboardShortcutsModal open onOpenChange={jest.fn()} />);
    expect(screen.getByText(/Atajos de teclado/)).toBeInTheDocument();
    expect(screen.getByText(/Enfocar búsqueda/)).toBeInTheDocument();
  });

  it("does not render dialog tree when closed", () => {
    render(<KeyboardShortcutsModal open={false} onOpenChange={jest.fn()} />);
    expect(screen.queryByText(/Atajos de teclado/)).not.toBeInTheDocument();
  });
});
