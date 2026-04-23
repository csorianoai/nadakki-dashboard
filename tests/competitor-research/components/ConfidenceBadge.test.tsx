import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { ConfidenceBadge } from "@/app/competitor-research/components/ConfidenceBadge";

describe("ConfidenceBadge", () => {
  it("renders high", () => {
    render(<ConfidenceBadge level="high" />);
    expect(screen.getByText("high")).toBeInTheDocument();
  });
  it("defaults to medium styling", () => {
    render(<ConfidenceBadge />);
    expect(screen.getByText("medium")).toBeInTheDocument();
  });
  it("renders low", () => {
    render(<ConfidenceBadge level="low" />);
    expect(screen.getByText("low")).toBeInTheDocument();
  });
});
