import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StipulationsModal } from "@/components/bank/StipulationsModal";

function modalRoot() {
  return screen.getByTestId("stipulations-modal");
}

function mx() {
  return within(modalRoot());
}

describe("StipulationsModal", () => {
  const onClose = jest.fn();
  const onSave = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { writable: true, configurable: true, value: true });
  });

  test("does not render when closed", () => {
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId="dealer-uuid"
        tenantId="t1"
        isOpen={false}
        onClose={onClose}
        onSave={onSave}
      />,
    );
    expect(screen.queryByTestId("stipulations-modal")).not.toBeInTheDocument();
  });

  test("opens with dialog semantics and labels", () => {
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId="dealer-uuid"
        tenantId="t1"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />,
    );
    const root = modalRoot();
    expect(root).toHaveAttribute("role", "dialog");
    expect(root).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(mx().getByRole("heading", { name: /nueva estipulación/i })).toBeInTheDocument();
  });

  test("closes on Cerrar", async () => {
    const user = userEvent.setup();
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId="dealer-uuid"
        tenantId="t1"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />,
    );
    await user.click(mx().getByTestId("stip-workflow-close"));
    expect(onClose).toHaveBeenCalled();
  });

  test("closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId="dealer-uuid"
        tenantId="t1"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  test("template picker selects backend type label", async () => {
    const user = userEvent.setup();
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId="dealer-uuid"
        tenantId="t1"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />,
    );
    await user.click(mx().getByRole("button", { name: /co-signer id/i }));
    expect(mx().getByText(/co_signer_cedula/i)).toBeInTheDocument();
  });

  test("save invokes onSave with payload", async () => {
    const user = userEvent.setup();
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId="dealer-uuid"
        tenantId="t1"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />,
    );
    await user.click(mx().getByRole("button", { name: /paystubs/i }));
    await user.click(mx().getByTestId("stip-workflow-save"));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "income_proof_payroll",
        dealer_id: "dealer-uuid",
      }),
    );
  });

  test("save disabled without dealer id", () => {
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId=""
        tenantId="t1"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />,
    );
    expect(mx().getByTestId("stip-workflow-save")).toBeDisabled();
  });

  test("offline queues payload instead of calling onSave immediately", async () => {
    Object.defineProperty(navigator, "onLine", { writable: true, configurable: true, value: false });
    const user = userEvent.setup();
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId="dealer-uuid"
        tenantId="t1"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />,
    );
    await user.click(mx().getByRole("button", { name: /tax returns/i }));
    await user.click(mx().getByTestId("stip-workflow-save"));
    expect(onSave).not.toHaveBeenCalled();
    expect(mx().getByText(/cola:/i)).toBeInTheDocument();
  });

  test("customer assignment tag is included in payload", async () => {
    const user = userEvent.setup();
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId="dealer-uuid"
        tenantId="t1"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />,
    );
    await user.click(mx().getByRole("button", { name: /^cliente$/i }));
    await user.click(mx().getByRole("button", { name: /paystubs/i }));
    await user.click(mx().getByTestId("stip-workflow-save"));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringMatching(/cliente/i),
      }),
    );
  });

  test("deadline sets sla_hours on payload", async () => {
    const user = userEvent.setup();
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId="dealer-uuid"
        tenantId="t1"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />,
    );
    fireEvent.change(mx().getByTestId("stip-workflow-deadline"), {
      target: { value: "2099-06-15T14:30" },
    });
    await user.click(mx().getByRole("button", { name: /paystubs/i }));
    await user.click(mx().getByTestId("stip-workflow-save"));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        sla_hours: expect.any(Number),
      }),
    );
    expect((onSave.mock.calls[0][0] as { sla_hours?: number }).sla_hours).toBeGreaterThanOrEqual(1);
  });

  test("clear resets template selection", async () => {
    const user = userEvent.setup();
    render(
      <StipulationsModal
        applicationId="app-1"
        dealerId="dealer-uuid"
        tenantId="t1"
        isOpen
        onClose={onClose}
        onSave={onSave}
      />,
    );
    await user.click(mx().getByRole("button", { name: /paystubs/i }));
    expect(mx().getByText(/income_proof_payroll/i)).toBeInTheDocument();
    await user.click(mx().getByTestId("stip-workflow-clear"));
    expect(mx().getByText(/other/i)).toBeInTheDocument();
  });
});
