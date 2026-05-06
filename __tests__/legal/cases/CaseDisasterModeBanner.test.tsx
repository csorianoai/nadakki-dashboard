/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseDisasterModeBanner } from "@/components/legal/cases/CaseDisasterModeBanner";

describe("CaseDisasterModeBanner", () => {
  it("no renderiza en modo normal", () => {
    const { container } = render(<CaseDisasterModeBanner level="NORMAL" />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza mensaje degradado LLM", () => {
    render(<CaseDisasterModeBanner level="LLM_DEGRADED" />);
    expect(screen.getByRole("status")).toHaveTextContent(/sin asistencia de IA/i);
  });
});
