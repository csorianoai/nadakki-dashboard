import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BankWorkflowStipulation } from "@/lib/bank/stipulations/workflow-types";
import { WorkflowStipulationsList } from "@/components/bank/WorkflowStipulationsList";

const baseRow = (partial: Partial<BankWorkflowStipulation> = {}): BankWorkflowStipulation => ({
  id: "wf-1",
  description: "Proof of residency",
  status: "pending",
  assigned_to: "dealer",
  deadline: undefined,
  documents_uploaded: [],
  updated_at: new Date().toISOString(),
  ...partial,
});

describe("WorkflowStipulationsList", () => {
  test("renders selectable rows via role list", () => {
    render(
      <WorkflowStipulationsList
        applicationId="app-1"
        stipulations={[baseRow()]}
        onUpdate={jest.fn()}
        selectable
        selectedIds={[]}
        onToggleSelect={jest.fn()}
      />,
    );
    expect(screen.getByTestId("workflow-stipulation-list-root")).toHaveAttribute("role", "list");
    expect(screen.getByTestId("workflow-stipulation-row")).toBeTruthy();
  });

  test("select checkbox toggles via callback", () => {
    const toggle = jest.fn();
    render(
      <WorkflowStipulationsList
        applicationId="app-2"
        stipulations={[baseRow({ id: "row-a" }), baseRow({ id: "row-b", description: "Otros datos" })]}
        selectable
        selectedIds={["row-a"]}
        onToggleSelect={toggle}
        onUpdate={jest.fn()}
      />,
    );
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(boxes[boxes.length - 1] as Element);
    expect(toggle).toHaveBeenCalled();
  });

  test("changing status notifies onUpdate handler", async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    render(
      <WorkflowStipulationsList
        applicationId="app-9"
        stipulations={[baseRow({ id: "row-x" })]}
        selectable={false}
        onUpdate={onUpdate}
      />,
    );
    await user.selectOptions(screen.getByLabelText(/estado/i), "sent");
    expect(onUpdate).toHaveBeenCalled();
    const arg = onUpdate.mock.calls[0][0] as BankWorkflowStipulation;
    expect(arg.status).toBe("sent");
  });

  test("shows evidence list when uploads exist", () => {
    render(
      <WorkflowStipulationsList
        applicationId="app-3"
        stipulations={[baseRow({ documents_uploaded: ["https://docs/x"] })]}
        onUpdate={jest.fn()}
      />,
    );
    expect(screen.getByText(/documentos/i)).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/docs\/x/)).toBeInTheDocument();
  });
});
