import { fireEvent, render, screen } from "@testing-library/react";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";

describe("ForgeButton ripple", () => {
  test("adds ripple on click", () => {
    render(<ForgeButton>Click me</ForgeButton>);
    fireEvent.click(screen.getByRole("button", { name: "Click me" }), { clientX: 10, clientY: 10 });
    expect(screen.getByTestId("forge-button-ripple")).toBeInTheDocument();
  });

  test("does not add ripple when disabled", () => {
    render(<ForgeButton disabled>Disabled</ForgeButton>);
    fireEvent.click(screen.getByRole("button", { name: "Disabled" }), { clientX: 10, clientY: 10 });
    expect(screen.queryByTestId("forge-button-ripple")).not.toBeInTheDocument();
  });
});
