import { render, screen } from "@testing-library/react";
import { ForgeInput } from "@/components/credit-hub/primitives/ForgeInput";

describe("ForgeInput shake", () => {
  test("wraps control for error shake animation", () => {
    render(<ForgeInput label="Email" error="Email inválido" />);
    expect(screen.getByTestId("forge-input-control")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Email inválido");
  });
});
