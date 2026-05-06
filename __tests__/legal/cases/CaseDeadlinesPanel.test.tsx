/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseDeadlinesPanel } from "@/components/legal/cases/CaseDeadlinesPanel";

jest.mock("@/hooks/legal/useCaseDeadlines", () => ({
  useCaseDeadlines: () => ({
    overrideDeadline: jest.fn(),
    overriding: false,
  }),
}));

const d = {
  deadline_id: "d1",
  deadline_db_id: "X",
  deadline_category: "civil",
  trigger_event: "e",
  trigger_date: "2026-01-01",
  auto_calculated_deadline_date: "2026-02-10",
  has_human_override: false,
  effective_deadline_date: "2099-01-01",
  status: "active" as const,
  legal_basis: "Ley",
  is_peremptory: true,
  is_extendable: false,
};

describe("CaseDeadlinesPanel", () => {
  it("muestra plazo activo", () => {
    render(<CaseDeadlinesPanel deadlines={[d]} caseId="c1" tenantId="t1" />);
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Modificar plazo/i })).toBeInTheDocument();
  });
});
