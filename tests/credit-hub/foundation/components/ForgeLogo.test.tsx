import { render, screen } from "@testing-library/react";
import { ForgeLogo } from "@/components/credit-hub/brand/ForgeLogo";

describe("ForgeLogo", () => {
  test("renders with default size", () => {
    render(<ForgeLogo />);
    expect(screen.getByRole("img", { name: "Nadakki Forge" })).toHaveClass("w-10", "h-10");
  });

  test("applies custom size class", () => {
    render(<ForgeLogo size="xl" />);
    expect(screen.getByRole("img", { name: "Nadakki Forge" })).toHaveClass("w-20", "h-20");
  });
});
