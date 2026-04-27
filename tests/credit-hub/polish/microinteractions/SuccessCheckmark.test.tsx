import { render, screen } from "@testing-library/react";
import { SuccessCheckmark } from "@/components/credit-hub/dealer/SuccessCheckmark";

describe("SuccessCheckmark", () => {
  test("renders accessible success graphic", () => {
    render(<SuccessCheckmark />);
    expect(screen.getByRole("img", { name: "Éxito" })).toBeInTheDocument();
  });
});
