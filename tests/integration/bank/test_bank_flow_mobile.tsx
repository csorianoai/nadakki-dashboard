/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentPreviewPane } from "@/components/bank/DocumentPreviewPane";
import { WorkflowStipulationsList } from "@/components/bank/WorkflowStipulationsList";
import type { BankWorkflowStipulation } from "@/lib/bank/stipulations/workflow-types";

jest.mock("@/hooks/useDocumentPreview", () => ({
  __esModule: true,
  useDocumentPreview: jest.fn(() => ({
    metadata: { pages: 3, page_count: 3, title: "Mobile bank PDF" },
    loading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

jest.mock("react-pdf", () => {
  const ReactLib = jest.requireActual("react");
  return {
    pdfjs: { version: "4.10.43", GlobalWorkerOptions: {} },
    Document: ({
      children,
      onLoadSuccess,
    }: {
      children?: React.ReactNode;
      onLoadSuccess?: (d: { numPages: number }) => void;
    }) => {
      ReactLib.useEffect(() => {
        onLoadSuccess?.({ numPages: 3 });
      }, [onLoadSuccess]);
      return <div data-testid="pdf-document">{children}</div>;
    },
    Page: ({
      pageNumber,
      scale,
      rotate,
    }: {
      pageNumber?: number;
      scale?: number;
      rotate?: number;
    }) => (
      <div
        data-testid={`pdf-page-${pageNumber ?? 1}`}
        data-scale={scale ?? ""}
        data-rotate={rotate ?? ""}
      />
    ),
  };
});

function resizeViewport(width: number, height: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

function stipulation(partial: Partial<BankWorkflowStipulation> = {}): BankWorkflowStipulation {
  return {
    id: "bank-stip-1",
    description: "Bank role proof of income",
    status: "pending",
    assigned_to: "dealer",
    documents_uploaded: [],
    updated_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function renderBankWorkflow(width: number, onUpdate = jest.fn()) {
  resizeViewport(width, 812);
  render(
    <WorkflowStipulationsList
      applicationId="bank-app-mobile"
      stipulations={[
        stipulation(),
        stipulation({ id: "bank-stip-2", description: "Bank role insurance proof", assigned_to: "customer" }),
      ]}
      selectable
      selectedIds={["bank-stip-1"]}
      onToggleSelect={jest.fn()}
      onUpdate={onUpdate}
    />
  );
}

describe("Bank frontend mobile integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(["%PDF-1.4 mobile bank"], { type: "application/pdf" }),
    });
    global.URL.createObjectURL = jest.fn().mockReturnValue("blob:bank-mobile");
    global.URL.revokeObjectURL = jest.fn();
  });

  test.each([
    [375, "iPhone SE"],
    [414, "iPhone 12"],
    [768, "iPad"],
  ])("renders bank workflow list at %ipx (%s)", (width) => {
    renderBankWorkflow(width);

    expect(screen.getByTestId("workflow-stipulation-list-root")).toHaveAttribute("role", "list");
    expect(screen.getAllByTestId("workflow-stipulation-row")).toHaveLength(2);
    expect(screen.getByLabelText(/Seleccionar estipulación Bank role proof of income/i)).toBeChecked();
  });

  test("bank role status controls update from mobile", async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    renderBankWorkflow(375, onUpdate);

    await user.selectOptions(screen.getByLabelText(/Estado para Bank role proof of income/i), "sent");

    expect(onUpdate).toHaveBeenCalled();
    expect((onUpdate.mock.calls[0][0] as BankWorkflowStipulation).status).toBe("sent");
  });

  test("document preview mobile controls remain usable", async () => {
    resizeViewport(414, 896);

    render(<DocumentPreviewPane documentId="doc-bank-mobile" applicationId="bank-app-mobile" tenantId="tenant-bank" />);

    await waitFor(() => expect(screen.getByTestId("pdf-page-1")).toBeInTheDocument());
    fireEvent.touchStart(screen.getByTestId("pdf-main-view"), {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 10, clientY: 0 },
      ],
    });
    fireEvent.touchMove(screen.getByTestId("pdf-main-view"), {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 30, clientY: 0 },
      ],
    });

    await waitFor(() => {
      expect(Number(screen.getByTestId("pdf-page-1").getAttribute("data-scale"))).toBeGreaterThan(1);
    });
    expect(screen.getByTestId("thumbnail-sidebar")).toBeInTheDocument();
  });

  test("bank-specific UI exposes dealer/customer assignment context", () => {
    renderBankWorkflow(768);

    expect(screen.getAllByText(/Asignada a:/i)).toHaveLength(2);
    expect(screen.getByText(/dealer/i)).toBeInTheDocument();
    expect(screen.getByText(/customer/i)).toBeInTheDocument();
  });
});
