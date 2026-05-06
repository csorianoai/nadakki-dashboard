/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CaseDeadlineOverrideModal } from "@/components/legal/cases/CaseDeadlineOverrideModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/hooks/legal/useCaseDeadlines", () => ({
  useCaseDeadlines: () => ({
    overrideDeadline: jest.fn().mockResolvedValue({}),
    overriding: false,
  }),
}));

const deadline = {
  deadline_id: "d1",
  deadline_db_id: "CIVIL-1",
  deadline_category: "civil",
  trigger_event: "notif",
  trigger_date: "2026-01-01",
  auto_calculated_deadline_date: "2026-02-01",
  has_human_override: false,
  effective_deadline_date: "2026-02-01",
  status: "active" as const,
  legal_basis: "Ley",
  is_peremptory: true,
  is_extendable: false,
};

function wrap(node: React.ReactElement) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

describe("CaseDeadlineOverrideModal", () => {
  it("valida longitud mínima de razón", async () => {
    const user = userEvent.setup();
    render(
      wrap(
        <CaseDeadlineOverrideModal
          deadline={deadline}
          caseId="c1"
          tenantId="t1"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      )
    );
    await user.click(screen.getByRole("button", { name: /Confirmar/i }));
    expect(await screen.findByText(/La razón debe tener al menos 10 caracteres/i)).toBeInTheDocument();
  });
});
