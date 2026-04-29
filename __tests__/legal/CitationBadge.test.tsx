import { render, screen } from "@testing-library/react";
import { CitationBadge } from "@/components/legal/CitationBadge";

describe("CitationBadge", () => {
  it("shows verified styling", () => {
    render(<CitationBadge citation="Ley 1-2 Art. 3" verified />);
    expect(screen.getByText(/Ley 1-2 Art\. 3/)).toBeInTheDocument();
  });

  it("shows unverified styling", () => {
    render(<CitationBadge citation="Ley X" verified={false} />);
    expect(screen.getByText("(no verificada)")).toBeInTheDocument();
  });
});
