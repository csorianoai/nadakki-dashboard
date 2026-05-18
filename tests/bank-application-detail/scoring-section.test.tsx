import { render, screen } from "@testing-library/react";
import { ScoringSection } from "@/app/(bank)/bank/applications/[id]/components/ScoringSection";

describe("ScoringSection", () => {
  test("renders PTI/DTI with percent and scores", () => {
    render(
      <ScoringSection
        scoring={{
          pti: 12.5,
          dti: 31.2,
          internal_score: 720,
          bureau_score: 685,
        }}
      />,
    );
    expect(screen.getByText("12.5%")).toBeInTheDocument();
    expect(screen.getByText("31.2%")).toBeInTheDocument();
    expect(screen.getByText("720")).toBeInTheDocument();
    expect(screen.getByText("685")).toBeInTheDocument();
  });

  test("uses dashes when metrics missing", () => {
    render(<ScoringSection scoring={{}} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
