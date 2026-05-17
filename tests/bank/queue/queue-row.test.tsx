/** @jest-environment jsdom */

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueueRow } from "@/app/(bank)/bank/applications/queue/components/QueueRow";
import { mockApplication, mockTenantThresholds } from "./test-utils";

describe("QueueRow", () => {
  it("renders borrower and fires review action", async () => {
    const user = userEvent.setup();
    const onActivate = jest.fn();
    const rowRef = createRef<HTMLTableRowElement>();
    const app = mockApplication({ borrower_name: "Ana G.", dealer_name: "Motor Nova" });

    render(
      <table>
        <tbody>
          <QueueRow
            ref={rowRef}
            application={app}
            thresholds={mockTenantThresholds()}
            selected
            tabIndex={0}
            onFocusRow={jest.fn()}
            onActivate={onActivate}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText(/Ana G\./)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Revisar/ }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("shows reviewing chip when claimed", () => {
    const rowRef = createRef<HTMLTableRowElement>();
    const app = mockApplication({ claimed_by: "cccccccc-cccc-cccc-cccc-cccccccccccc" });
    render(
      <table>
        <tbody>
          <QueueRow
            ref={rowRef}
            application={app}
            thresholds={mockTenantThresholds()}
            selected={false}
            tabIndex={-1}
            onFocusRow={jest.fn()}
            onActivate={jest.fn()}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText(/En revisión/)).toBeInTheDocument();
  });
});
