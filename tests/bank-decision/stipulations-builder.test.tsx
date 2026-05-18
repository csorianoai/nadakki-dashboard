import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StipulationsBuilder } from "@/app/(bank)/bank/applications/[id]/components/StipulationsBuilder";

describe("StipulationsBuilder", () => {
  test("add row extends list", async () => {
    const onChange = jest.fn();
    render(<StipulationsBuilder value={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /añadir/i }));
    expect(onChange).toHaveBeenCalled();
  });

  test("typing updates description", async () => {
    const onChange = jest.fn();
    render(<StipulationsBuilder value={[{ description: "", status: "open" }]} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText(/estipulación 1/i), "Doc");
    expect(onChange).toHaveBeenCalled();
  });
});
