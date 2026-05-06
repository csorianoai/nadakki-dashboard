/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseSnapshotsList } from "@/components/legal/cases/CaseSnapshotsList";

describe("CaseSnapshotsList", () => {
  it("lista vacía", () => {
    render(<CaseSnapshotsList caseId="c1" snapshots={[]} />);
    expect(screen.getByText(/No hay versiones guardadas/i)).toBeInTheDocument();
  });
});
