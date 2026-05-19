/** @jest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { BankWorkflowOrchestrationModal } from "@/components/bank/BankWorkflowOrchestrationModal";
import { useBankStipulationsWorkflow } from "@/hooks/useBankStipulationsWorkflow";

jest.mock("@/hooks/useBankStipulationsWorkflow", () => ({
  useBankStipulationsWorkflow: jest.fn(),
}));

const workflowMockFactory = (): ReturnType<typeof useBankStipulationsWorkflow> => ({
  items: [
    {
      id: "row-1",
      description: "Una estipulación",
      status: "pending",
      assigned_to: "dealer",
      documents_uploaded: [],
      updated_at: new Date().toISOString(),
    },
  ],
  isLoading: false,
  hasOfflineQueuedChanges: false,
  liveRegionMessage: "",
  role: "BANK_ANALYST",
  refresh: jest.fn(async () => {}),
  bulkMarkAllSent: jest.fn(),
  bulkResetToPending: jest.fn(),
  addFromTemplate: jest.fn(),
  addCustomStipulation: jest.fn(() => null),
  updateRow: jest.fn(() => ({ ok: true })),
  persistLocalSnapshot: jest.fn(),
  sendToDealer: jest.fn(async () => ({ ok: true })),
});

describe("BankWorkflowOrchestrationModal", () => {
  const mocked = jest.mocked(useBankStipulationsWorkflow);

  beforeEach(() => {
    jest.clearAllMocks();
    mocked.mockReturnValue(workflowMockFactory());
  });

  test("renders orchestration scaffold when open", () => {
    render(<BankWorkflowOrchestrationModal applicationId="app-xyz" tenantId="t-op" isOpen onClose={jest.fn()} />);
    expect(screen.getByTestId("bank-workflow-orchestration")).toHaveAttribute("role", "dialog");
    expect(screen.getByRole("heading", { name: /Orquestación de estipulaciones/i })).toBeTruthy();
  });

  test("esc closes orchestration", () => {
    const onClose = jest.fn();
    render(<BankWorkflowOrchestrationModal applicationId="app-z" tenantId="t-op" isOpen onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  test("template picker delegates to workflow hook", () => {
    const fake = workflowMockFactory();
    mocked.mockReturnValue(fake);
    render(<BankWorkflowOrchestrationModal applicationId="app-a" tenantId="t-op" isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId("bank-workflow-tpl-paystubs-3mo"));
    expect(fake.addFromTemplate).toHaveBeenCalled();
  });

  test("bulk mark all sends triggers hook", () => {
    const fake = workflowMockFactory();
    mocked.mockReturnValue(fake);
    render(<BankWorkflowOrchestrationModal applicationId="app-b" tenantId="t-op" isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId("bank-workflow-bulk-sent"));
    expect(fake.bulkMarkAllSent).toHaveBeenCalled();
  });

  test("send dealer uses hook transport", async () => {
    const fake = workflowMockFactory();
    mocked.mockReturnValue(fake);
    render(<BankWorkflowOrchestrationModal applicationId="app-send" tenantId="t-op" isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId("bank-workflow-send-dealer"));
    await Promise.resolve();
    expect(fake.sendToDealer).toHaveBeenCalled();
  });

  test("custom add invokes validation path", () => {
    const fake = workflowMockFactory();
    fake.addCustomStipulation = jest.fn(() => "campo obligatorio") as typeof fake.addCustomStipulation;
    mocked.mockReturnValue(fake);
    render(<BankWorkflowOrchestrationModal applicationId="app-cust" tenantId="t-op" isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId("bank-workflow-orchestration-add-custom"));
    expect(fake.addCustomStipulation).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/campo obligatorio/i);
  });
});
