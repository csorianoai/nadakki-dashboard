import { render, screen } from "@testing-library/react";
import { ForgeLogo } from "@/components/credit-hub/brand/ForgeLogo";

describe("ForgeLogo", () => {
  test("renders with default size", () => {
    render(<ForgeLogo />);
    expect(screen.getByRole("img", { name: "Forge" })).toHaveClass("w-10", "h-10");
  });

  test("applies custom size class", () => {
    render(<ForgeLogo size="xl" />);
    expect(screen.getByRole("img", { name: "Forge" })).toHaveClass("w-20", "h-20");
  });

  test("uses tenant display name in full variant", () => {
    render(<ForgeLogo variant="full" displayName="Credicefi" />);
    expect(screen.getByRole("img", { name: "Credicefi Forge" })).toBeInTheDocument();
  });
});
