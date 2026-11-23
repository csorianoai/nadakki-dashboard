/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { HearingStatusBadge } from "@/components/legal/hearings/HearingStatusBadge";

describe("HearingStatusBadge", () => {
  it("renders a known status", () => {
    render(<HearingStatusBadge status="SCHEDULED" />);
    expect(screen.getByText("Programada")).toBeInTheDocument();
  });

  it("tolerates an UNKNOWN status without crashing", () => {
    render(<HearingStatusBadge status="SOMETHING_NEW" />);
    expect(screen.getByText("Something New")).toBeInTheDocument();
  });
});
