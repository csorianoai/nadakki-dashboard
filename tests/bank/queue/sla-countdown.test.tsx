/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { SlaCountdown } from "@/app/(bank)/bank/applications/queue/components/SlaCountdown";

describe("SlaCountdown", () => {
  it("marks overdue state", () => {
    render(<SlaCountdown hoursUntilSla={-2} />);
    expect(screen.getByTestId("sla-countdown")).toHaveAttribute("data-overdue", "true");
    expect(screen.getByTestId("sla-countdown")).toHaveTextContent("Vencido");
  });

  it("shows compact duration under three days", () => {
    render(<SlaCountdown hoursUntilSla={2.5} />);
    expect(screen.getByTestId("sla-countdown")).toHaveTextContent("2h");
  });

  it("shows days when beyond 72 hours", () => {
    render(<SlaCountdown hoursUntilSla={96} />);
    expect(screen.getByTestId("sla-countdown")).toHaveTextContent("4d");
  });
});
