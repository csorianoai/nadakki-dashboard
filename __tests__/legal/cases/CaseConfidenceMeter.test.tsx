/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseConfidenceMeter } from "@/components/legal/cases/CaseConfidenceMeter";

describe("CaseConfidenceMeter", () => {
  it("renderiza puntuación", () => {
    render(
      <CaseConfidenceMeter
        confidence={{
          overall_score: 0.72,
          factors: { documents_complete: 0.8 },
          last_calculated_at: "2026-01-01",
        }}
      />
    );
    expect(screen.getByRole("meter", { name: /Confianza del expediente/i })).toHaveAttribute("aria-valuenow", "72");
  });
});
