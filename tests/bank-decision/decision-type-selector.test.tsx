import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DecisionTypeSelector } from "@/app/(bank)/bank/applications/[id]/components/DecisionTypeSelector";

describe("DecisionTypeSelector", () => {
  test("three radio-role buttons", () => {
    render(<DecisionTypeSelector value={null} onChange={jest.fn()} />);
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  test("onChange fires with REJECT", async () => {
    const cb = jest.fn();
    render(<DecisionTypeSelector value={null} onChange={cb} />);
    await userEvent.click(screen.getByRole("radio", { name: /rechazar/i }));
    expect(cb).toHaveBeenCalledWith("REJECT");
  });
});
