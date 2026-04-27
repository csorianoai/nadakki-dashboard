import { fireEvent, render, screen } from "@testing-library/react";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";

describe("ForgeButton", () => {
  test("renders with primary variant", () => {
    render(<ForgeButton>Submit</ForgeButton>);
    expect(screen.getByRole("button", { name: "Submit" })).toHaveClass("from-forge-primary");
  });

  test("shows loading state", () => {
    const { container } = render(<ForgeButton loading>Saving</ForgeButton>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  test("disabled state prevents click", () => {
    const onClick = jest.fn();
    render(
      <ForgeButton disabled onClick={onClick}>
        Disabled
      </ForgeButton>
    );

    fireEvent.click(screen.getByRole("button", { name: "Disabled" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
