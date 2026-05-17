/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { QueueTable } from "@/app/(bank)/bank/applications/queue/components/QueueTable";
import { BANK_QUEUE_VIRTUALIZATION_ROW_CAP } from "@/lib/bank-queue/constants";
import { mockApplication, mockTenantThresholds } from "./test-utils";

describe("QueueTable", () => {
  it("renders column headers", () => {
    const capture = jest.fn();
    render(
      <QueueTable
        applications={[mockApplication()]}
        thresholds={mockTenantThresholds()}
        focusedRowIndex={0}
        captureRowRef={capture}
        onFocusRowIndex={jest.fn()}
        onOpenApplication={jest.fn()}
      />,
    );
    expect(screen.getByRole("columnheader", { name: /PTI/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /DTI/i })).toBeInTheDocument();
  });

  it("shows virtualization banner when many rows", () => {
    const rows = Array.from({ length: BANK_QUEUE_VIRTUALIZATION_ROW_CAP + 1 }, (_, i) =>
      mockApplication({
        application_id: `bbbbbbbb-bbbb-bbbb-bbbb-${String(i).padStart(12, "0")}`,
      }),
    );
    render(
      <QueueTable
        applications={rows}
        thresholds={mockTenantThresholds()}
        focusedRowIndex={0}
        captureRowRef={jest.fn()}
        onFocusRowIndex={jest.fn()}
        onOpenApplication={jest.fn()}
        virtualizationBanner={
          <div role="status">Virtualización activa ({BANK_QUEUE_VIRTUALIZATION_ROW_CAP}+)</div>
        }
      />,
    );
    expect(screen.getByText(/Virtualización activa/)).toBeInTheDocument();
  });
});
