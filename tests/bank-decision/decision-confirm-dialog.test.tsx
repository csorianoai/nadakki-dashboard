import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DecisionConfirmDialog } from "@/app/(bank)/bank/applications/[id]/components/DecisionConfirmDialog";

jest.mock("@/components/ui/dialog", () => {
  const React = require("react");
  const Dialog = ({ children, open }: { open: boolean; children: React.ReactNode }) =>
    open ? React.createElement("div", { "data-testid": "dlg" }, children) : null;
  const Inner = ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>> & { title?: string }) =>
    React.createElement("div", props, children);
  return {
    Dialog,
    DialogContent: Inner,
    DialogHeader: Inner,
    DialogTitle: Inner,
    DialogFooter: Inner,
    DialogPortal: Inner,
    DialogOverlay: Inner,
    DialogTrigger: Inner,
    DialogClose: Inner,
    DialogDescription: Inner,
  };
});

describe("DecisionConfirmDialog", () => {
  test("confirm invokes callback", async () => {
    const onLeave = jest.fn();
    render(
      <DecisionConfirmDialog open onOpenChange={jest.fn()} onConfirmLeave={onLeave} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /salir sin guardar/i }));
    expect(onLeave).toHaveBeenCalled();
  });
});
