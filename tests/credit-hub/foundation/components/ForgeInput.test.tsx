import { render, screen } from "@testing-library/react";
import { ForgeInput } from "@/components/credit-hub/primitives/ForgeInput";

describe("ForgeInput", () => {
  test('shows error message with role="alert"', () => {
    render(<ForgeInput label="Email" error="Email inválido" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Email inválido");
  });

  test("associates label with input via id", () => {
    render(<ForgeInput id="applicant-name" label="Applicant name" />);
    expect(screen.getByLabelText("Applicant name")).toHaveAttribute("id", "applicant-name");
  });
});
