/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { LegalDisclaimerFooter } from "@/components/legal/LegalDisclaimerFooter";

describe("LegalDisclaimerFooter", () => {
  it("shows Ley 91 text and has no dismiss control", () => {
    render(<LegalDisclaimerFooter />);
    expect(screen.getByText(/Ley 91/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cerrar/i })).not.toBeInTheDocument();
  });
});
