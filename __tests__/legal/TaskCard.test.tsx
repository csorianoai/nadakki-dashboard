/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCard } from "@/components/legal/TaskCard";
import { LegalTaskExecuteProvider } from "@/hooks/useExecuteLegalTask";
import { TenantProvider } from "@/contexts/TenantContext";
import type { LegalTask } from "@/lib/legal/task-types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

const mockTask: LegalTask = {
  task_id: "t1",
  display_name_es: "Revisar contrato",
  display_name_en: "Review contract",
  description_es: "Descripción en español",
  description_en: "English description",
  section_es: "Contratos",
  section_en: "Contracts",
  icon_hint: "x",
  agent_chain: [],
  default_practice_area_tags: ["civil", "bancario"],
  required_inputs: [],
  output_type: "modal",
  requires_attorney_review: true,
  max_execution_time_ms: 1000,
  risk_level: "low",
  audit_required: true,
  min_knowledge_pack_level: "level_1_verified",
  fallback_action: "review",
  sync_mode: "sync",
  tenant_features_required: [],
  compliance_jurisdiction_scope: ["do"],
  estimated_time_es: "≈ 10 segundos",
  estimated_time_en: "≈ 10 seconds",
};

function wrap(ui: React.ReactElement) {
  return (
    <TenantProvider>
      <LegalTaskExecuteProvider>{ui}</LegalTaskExecuteProvider>
    </TenantProvider>
  );
}

describe("TaskCard", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nadakki_tenant_id", "tenant-demo");
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("renders display_name_es, description_es, estimated_time_es, chips, badge", () => {
    render(
      wrap(
        <TaskCard task={mockTask} accentClass="border-forgeInfo-500" enabled lockedMessage="bloqueado" />
      )
    );
    expect(screen.getByText("Revisar contrato")).toBeInTheDocument();
    expect(screen.getByText("Descripción en español")).toBeInTheDocument();
    expect(screen.getByText("≈ 10 segundos")).toBeInTheDocument();
    expect(screen.getByText("Civil")).toBeInTheDocument();
    expect(screen.getByText("Bancario")).toBeInTheDocument();
    expect(screen.getByText(/Requiere revisión/i)).toBeInTheDocument();
  });

  it("does not render display_name_en by default", () => {
    render(wrap(<TaskCard task={mockTask} accentClass="border-forgeInfo-500" enabled lockedMessage="x" />));
    expect(screen.queryByText("Review contract")).not.toBeInTheDocument();
  });

  it("click invokes task when enabled", async () => {
    const user = userEvent.setup();
    render(wrap(<TaskCard task={mockTask} accentClass="border-forgeInfo-500" enabled lockedMessage="x" />));
    await user.click(screen.getByRole("button", { name: /Iniciar tarea/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
