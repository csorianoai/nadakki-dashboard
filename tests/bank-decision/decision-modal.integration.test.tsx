jest.mock("@/components/ui/dialog", () => {
  const React = require("react");
  const Stub = ({
    children,
    open,
  }: React.PropsWithChildren<{ open?: boolean; onOpenChange?: (v: boolean) => void }>) =>
    open === false ? null : React.createElement("div", {}, children);
  const Content = ({ children }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement("div", { "data-testid": "decision-modal-content" }, children);
  return {
    Dialog: Stub,
    DialogContent: Content,
    DialogFooter: Stub,
    DialogHeader: Stub,
    DialogTitle: ({ children }: { children?: React.ReactNode }) => React.createElement("h2", {}, children),
    DialogPortal: Stub,
    DialogOverlay: Stub,
    DialogTrigger: Stub,
    DialogClose: Stub,
    DialogDescription: Stub,
  };
});

jest.mock("next/navigation", () => ({ usePathname: () => "/bank/applications/x" }));
jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn(), message: jest.fn() } }));
jest.mock("@/lib/bank-decision/submit-decision", () => ({
  submitBankDecision: jest.fn().mockResolvedValue({
    decision_id: "d1",
    application_id: "a1",
    decision_type: "APPROVE",
    decided_at: "2026-01-01T00:00:00Z",
  }),
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DecisionFormModal } from "@/app/(bank)/bank/applications/[id]/components/DecisionFormModal";
import { BankApplicationHttpError } from "@/lib/bank-application-detail/errors";
import { submitBankDecision } from "@/lib/bank-decision/submit-decision";

describe("DecisionFormModal integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows analyst warning when actor missing", async () => {
    render(
      <DecisionFormModal
        applicationId="a1"
        analystActorId={null}
        currency="DOP"
        grossMonthlyIncome={75000}
        baselineAmount={100000}
        open
        onOpenChange={jest.fn()}
      />,
    );
    expect(await screen.findByText(/analyst_id/i)).toBeInTheDocument();
  });

  test("approve path calls submitBankDecision", async () => {
    const onSubmitted = jest.fn();
    render(
      <DecisionFormModal
        applicationId="a1"
        analystActorId="11111111-1111-4111-8111-111111111111"
        currency="DOP"
        grossMonthlyIncome={75000}
        baselineAmount={100000}
        open
        onOpenChange={jest.fn()}
        onSubmitted={onSubmitted}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /aprobar/i }));
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    await userEvent.click(screen.getByRole("button", { name: /registrar decisión/i }));
    await waitFor(() => expect(submitBankDecision).toHaveBeenCalled());
    expect(onSubmitted).toHaveBeenCalled();
  });

  test("validation blocks submit without reason", async () => {
    render(
      <DecisionFormModal
        applicationId="a1"
        analystActorId="11111111-1111-4111-8111-111111111111"
        currency="DOP"
        open
        onOpenChange={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /aprobar/i }));
    await userEvent.click(screen.getByRole("button", { name: /registrar decisión/i }));
    expect(submitBankDecision).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  test("reject requires adverse acknowledgement", async () => {
    render(
      <DecisionFormModal
        applicationId="a1"
        analystActorId="11111111-1111-4111-8111-111111111111"
        currency="DOP"
        open
        onOpenChange={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /rechazar/i }));
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    await userEvent.click(screen.getByRole("button", { name: /registrar decisión/i }));
    expect(submitBankDecision).not.toHaveBeenCalled();
  });

  test("counter shows calculator section", async () => {
    render(
      <DecisionFormModal
        applicationId="a1"
        analystActorId="11111111-1111-4111-8111-111111111111"
        currency="DOP"
        grossMonthlyIncome={50000}
        baselineAmount={200000}
        open
        onOpenChange={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /contraoferta/i }));
    expect(screen.getByText(/Calculadora de contraoferta/i)).toBeInTheDocument();
  });

  test("notes length validation fires", async () => {
    render(
      <DecisionFormModal
        applicationId="a1"
        analystActorId="11111111-1111-4111-8111-111111111111"
        currency="DOP"
        open
        onOpenChange={jest.fn()}
      />,
    );
    const ta = screen.getByPlaceholderText(/opcional/i);
    await userEvent.click(screen.getByRole("radio", { name: /aprobar/i }));
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.change(ta, { target: { value: "n".repeat(2001) } });
    await userEvent.click(screen.getByRole("button", { name: /registrar decisión/i }));
    await waitFor(() => expect(screen.getAllByRole("alert").length).toBeGreaterThan(0));
  });

  test("cancel with dirty shows confirm dialog", async () => {
    render(
      <DecisionFormModal
        applicationId="a1"
        analystActorId="11111111-1111-4111-8111-111111111111"
        currency="DOP"
        open
        onOpenChange={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /aprobar/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.getByText(/¿Salir del formulario/i)).toBeInTheDocument();
  });

  test("approve stipulations trimmed on submit", async () => {
    render(
      <DecisionFormModal
        applicationId="a9"
        analystActorId="11111111-1111-4111-8111-111111111111"
        currency="DOP"
        initialStipulations={[{ description: "  Factura ", status: "open" }]}
        open
        onOpenChange={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /aprobar/i }));
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    await userEvent.click(screen.getByRole("button", { name: /registrar decisión/i }));
    await waitFor(() => expect(submitBankDecision).toHaveBeenCalled());
    const arg = (submitBankDecision as jest.Mock).mock.calls[0][1];
    expect(arg.stipulations?.some((s: { description: string }) => s.description === "Factura")).toBe(true);
  });

  test("409 maps to toast error", async () => {
    const { toast } = require("sonner");
    (submitBankDecision as jest.Mock).mockRejectedValueOnce(new BankApplicationHttpError("Conflict", 409, "CONFLICT"));
    render(
      <DecisionFormModal
        applicationId="a1"
        analystActorId="11111111-1111-4111-8111-111111111111"
        currency="DOP"
        open
        onOpenChange={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /aprobar/i }));
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    await userEvent.click(screen.getByRole("button", { name: /registrar decisión/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  test("counter no_match shows adverse preview panel", async () => {
    render(
      <DecisionFormModal
        applicationId="a1"
        analystActorId="11111111-1111-4111-8111-111111111111"
        currency="DOP"
        grossMonthlyIncome={80000}
        baselineAmount={300000}
        open
        onOpenChange={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /contraoferta/i }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Sin match/i }));
    expect(screen.getByText(/Vista previa de acción adversa/i)).toBeInTheDocument();
  });
});
