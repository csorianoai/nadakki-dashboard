/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseSnapshotsList } from "@/components/legal/cases/CaseSnapshotsList";

describe("CaseSnapshotsList", () => {
  it("lista vacía", () => {
    render(<CaseSnapshotsList tenantId="d3b00111-0000-0000-0000-000000d3b001" caseId="c1" snapshots={[]} />);
    expect(screen.getByText(/No hay versiones guardadas/i)).toBeInTheDocument();
  });
});
