/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CaseList } from "@/components/legal/cases/CaseList";
import type { LegalCase } from "@/lib/legal/cases/case-types";

const baseCase = (over: Partial<LegalCase>): LegalCase => ({
  case_id: "1",
  case_number_internal: "INT-1",
  case_type: "defensa_civil_cobro_pesos",
  legal_jurisdiction: "do",
  state: "INGESTION",
  title: "Caso demo",
  practice_area_tags: [],
  priority: "normal",
  client_roles: [],
  related_case_ids: [],
  has_expired_critical_deadline_at_ingestion: false,
  actors: [],
  documents: [],
  deadlines: [],
  strategies: [],
  open_issues_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...over,
});

function qc(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

describe("CaseList", () => {
  it("muestra vacío cuando no hay expedientes", () => {
    render(qc(<CaseList cases={[]} loading={false} error={null} />));
    expect(screen.getByText(/No tienes expedientes activos/i)).toBeInTheDocument();
  });

  it("renderiza tarjetas cuando hay expedientes", () => {
    render(qc(<CaseList cases={[baseCase({ case_id: "a", title: "Uno" })]} loading={false} error={null} />));
    expect(screen.getByRole("link", { name: "Uno" })).toBeInTheDocument();
  });
});
