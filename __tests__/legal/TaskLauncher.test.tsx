/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { TaskLauncher } from "@/components/legal/TaskLauncher";
import { TASK_FIXTURES } from "@/lib/legal/task-fixtures";
import { TenantProvider } from "@/contexts/TenantContext";
import { LegalTaskExecuteProvider } from "@/hooks/useExecuteLegalTask";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

function wrap(node: React.ReactElement) {
  return (
    <TenantProvider>
      <LegalTaskExecuteProvider>{node}</LegalTaskExecuteProvider>
    </TenantProvider>
  );
}

describe("TaskLauncher", () => {
  it("groups tasks by section_es", () => {
    render(wrap(<TaskLauncher tasks={TASK_FIXTURES} loading={false} error={null} />));
    expect(screen.getByRole("heading", { name: "Contratos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Litigios" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Compliance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Investigación" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar tarea: Revisar contrato" })).toBeInTheDocument();
  });
});
