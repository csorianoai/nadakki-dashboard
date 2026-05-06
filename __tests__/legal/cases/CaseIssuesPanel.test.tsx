/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseIssuesPanel } from "@/components/legal/cases/CaseIssuesPanel";

describe("CaseIssuesPanel", () => {
  it("sin incidencias", () => {
    render(<CaseIssuesPanel issues={[]} onReport={() => {}} />);
    expect(screen.getByText(/No hay incidencias abiertas/i)).toBeInTheDocument();
  });
});
