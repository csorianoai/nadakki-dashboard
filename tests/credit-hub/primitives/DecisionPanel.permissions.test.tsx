import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DecisionPanel } from "@/components/credit-hub/primitives/DecisionPanel";

describe("DecisionPanel permissions", () => {
  test("disables submit when canDecide is false", () => {
    render(<DecisionPanel canDecide={false} onSubmit={jest.fn()} />);
    expect(screen.getByTestId("decision-panel-forbidden")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: /aprobar solicitud/i });
    expect(submit).toBeDisabled();
  });

  test("allows submit when canDecide is true and justification filled", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<DecisionPanel canDecide onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText(/sustento de la decisión/i), "OK policy");
    await user.click(screen.getByRole("button", { name: /aprobar solicitud/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  test("explains the hidden lender requirement and enables submit after selection", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DecisionPanel
        canDecide
        lenderOptions={["pilot", "mock"]}
        onLenderChange={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    await user.type(screen.getByPlaceholderText(/sustento de la decisión/i), "OK policy");
    const submit = screen.getByRole("button", { name: /aprobar solicitud/i });
    expect(submit).toBeDisabled();
    expect(screen.getByTestId("decision-panel-lender-required")).toHaveTextContent(/Selecciona el lender/i);
    expect(submit).toHaveAttribute("aria-describedby", "decision-lender-required");

    rerender(
      <DecisionPanel
        canDecide
        lenderOptions={["pilot", "mock"]}
        lenderCode="pilot"
        onSubmit={jest.fn()}
      />
    );
    await user.type(screen.getByPlaceholderText(/sustento de la decisión/i), "OK policy");
    expect(screen.getByRole("button", { name: /aprobar solicitud/i })).toBeEnabled();
  });
});
