import { render, screen } from "@testing-library/react";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";

describe("ForgeCard", () => {
  test("renders interactive variant with hover", () => {
    render(<ForgeCard variant="interactive">Interactive</ForgeCard>);
    expect(screen.getByText("Interactive")).toHaveClass("hover:bg-forge-surface-hover", "cursor-pointer");
  });
});
