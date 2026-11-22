/** @jest-environment jsdom */
/**
 * DASH-LEGAL L2a: no presentar como verificado lo que no lo es, y que los
 * errores del backend se vean en español llano.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/styles/legal-research-papel-blanco.css", () => ({}));
jest.mock("@/lib/legal/telemetry", () => ({ trackEvent: jest.fn(), emitLegalTaskInvoked: jest.fn() }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/legal/research",
}));
const runMock = jest.fn();
jest.mock("@/hooks/useLegal", () => ({
  useLegalEffectiveTenantId: () => ({ effectiveTenantId: "t1", tenantHydrated: true, tenantError: null }),
  useLegalAgentRun: () => ({ run: runMock, loading: false }),
  useLegalQuickCheck: () => quickCheckState,
  useKnowledgePackInfo: () => ({ info: null, loading: false, error: null }),
}));
let quickCheckState: Record<string, unknown> = {};

jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "tok" } }));
jest.mock("@/lib/auth/token-refresh", () => ({ isTokenExpiringSoon: () => false, refreshAccessToken: async () => false }));

import { legalCaughtErrorToSpanish, legalErrorToSpanish } from "@/lib/legal/api-error-es";
import { createCase } from "@/lib/legal/cases/legal-cases-api";
import { LegalApiHttpError } from "@/lib/legal/parse-api-error";
import { TaskExecutionResult } from "@/components/legal/TaskExecutionResult";
import { TaskExecuteModal } from "@/components/legal/TaskExecuteModal";
import { ResearchComposer } from "@/components/legal/research/papel-blanco/ResearchComposer";
import { CITATION_TIPO_META } from "@/lib/legal/research/citation-type";
import LegalResearchClient from "@/components/legal/LegalResearchClient";
import LegalForgeContractsPage from "@/app/(forge)/legal/contracts/page";

describe("errores del backend en español llano", () => {
  it.each([
    [403, "insufficient_role: requires one of ('tenant_attorney',)", /Tu rol no tiene permiso/],
    [403, "sin unidad organizativa resoluble", /unidad organizativa asignada/],
    [403, "capability_denied:legal.cases.create:TARGET_CORE_NOT_READY", /todavía no está habilitada/],
    [403, "capability_denied:legal.cases.view:NO_ACTIVE_SUBSCRIPTION", /suscripción activa/],
    [403, "capability_denied:legal.cases.create:no_beneficiary_entitlement", /no tiene habilitado el acceso a Legal/],
    [403, "capability_denied:legal.cases.create:capability_not_in_archetype", /tipo de organización/],
    [403, "capability_denied:legal.cases.create:no_organization_unit", /unidad organizativa asignada/],
    [403, "tenant_mismatch", /no coincide con tu sesión/],
    [401, "missing_auth", /Vuelve a iniciar sesión/],
  ])("%i %s", (status, detail, esperado) => {
    const msg = legalErrorToSpanish(status, detail);
    expect(msg).toMatch(esperado);
    expect(msg).not.toMatch(/insufficient_role|capability_denied|missing_auth|tenant_mismatch/);
  });

  it("PASSWORD_CHANGE_REQUIRED (detail dict) llega por LegalApiHttpError", () => {
    const body = JSON.stringify({ detail: { error_code: "PASSWORD_CHANGE_REQUIRED", message: "x" } });
    const e = new LegalApiHttpError("Error al crear expediente", 403, body);
    expect(legalCaughtErrorToSpanish(e)).toMatch(/cambiar tu contraseña/);
  });
});

describe("Crear expediente conserva el error del backend", () => {
  it("un 403 de rol llega con status y detail, y se traduce", async () => {
    const body = JSON.stringify({ detail: "insufficient_role: requires one of ('tenant_attorney',)" });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, text: async () => body }) as unknown as typeof fetch;
    const err = await createCase("t1", { case_type: "x", title: "t", initial_actors: [] } as never).catch((e) => e);
    expect(err.status).toBe(403);
    expect(legalCaughtErrorToSpanish(err)).toMatch(/Tu rol no tiene permiso/);
  });
});

describe("Analizar contrato muestra el error del backend", () => {
  it("un 403 de rol se ve en pantalla y no queda en silencio", async () => {
    const err = { status: 403, endpoint: "/api/v1/legal/quick-check", error: { message: "Acceso denegado", detail: { detail: "insufficient_role: requires one of ('tenant_attorney',)" } } };
    quickCheckState = { loading: false, result: null, tenantMissing: false, submit: jest.fn().mockRejectedValue(err) };
    render(<LegalForgeContractsPage />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Contrato de alquiler de prueba" } });
    fireEvent.click(screen.getByRole("button", { name: /Analizar contrato/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/No se pudo analizar el contrato\. Tu rol no tiene permiso/);
  });

  it("sin decision (timeout del backend) no inventa veredicto ni rompe la página", () => {
    quickCheckState = { loading: false, result: { result: "review_required", reason: "timeout" }, tenantMissing: false, submit: jest.fn() };
    render(<LegalForgeContractsPage />);
    expect(screen.getByRole("status")).toHaveTextContent(/no terminó y no hay resultado/);
  });
});

describe("tareas: modo visible y sin JSON crudo", () => {
  const data = {
    task_id: "review_contract",
    sealed_output: { estado: "exito", decision: { accion: "revision", confianza: 0.3, explicacion: "Revisar cláusula 4.", siguientes_pasos: ["Consultar abogado"] } },
  };

  it("simulación declarada, resumen legible y sin JSON", () => {
    const { container } = render(<TaskExecutionResult data={data} dryRun />);
    expect(screen.getByTestId("task-run-mode")).toHaveTextContent(/Simulación/);
    expect(screen.getByText("Revisar cláusula 4.")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/sealed_output|"confianza"|\{/);
    expect(container.querySelector("pre")).toBeNull();
  });

  it("el modal envía dry_run: true explícito y lo declara", async () => {
    const runExecute = jest.fn().mockResolvedValue(data);
    const task = { task_id: "review_contract", required_inputs: [], sync_mode: "sync" } as never;
    render(<TaskExecuteModal task={task} tenantId="t1" onClose={jest.fn()} runExecute={runExecute} />);
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar" }));
    expect(await screen.findByTestId("task-run-mode")).toHaveTextContent(/Simulación/);
    expect(runExecute).toHaveBeenCalledWith("t1", "review_contract", expect.objectContaining({ dry_run: true }));
  });

  it("estado error: no muestra explicación técnica", () => {
    render(<TaskExecutionResult data={{ sealed_output: { estado: "error", decision: { explicacion: "Agent 'x' failed: KeyError" } } }} dryRun={false} />);
    expect(screen.getByTestId("task-run-mode")).toHaveTextContent(/Ejecución real/);
    expect(screen.getByRole("alert")).toHaveTextContent(/no se completó/);
    expect(screen.queryByText(/KeyError/)).toBeNull();
  });
});

describe("Investigación", () => {
  it("Enter envía y Shift+Enter no", () => {
    const onSubmit = jest.fn();
    render(<ResearchComposer value="consulta" onChange={() => {}} onSubmit={onSubmit} maxChars={4000} />);
    const box = screen.getByLabelText("Escribe tu consulta legal");
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("tras un error la caja sigue y conserva la pregunta", async () => {
    runMock.mockRejectedValueOnce({ status: 401, message: "missing_auth" });
    render(<LegalResearchClient />);
    const box = screen.getByLabelText("Escribe tu consulta legal");
    fireEvent.change(box, { target: { value: "Plazo de preaviso" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(runMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByLabelText("Escribe tu consulta legal")).toHaveValue("Plazo de preaviso"));
  });

  it("las fuentes no se anuncian como verificadas", () => {
    expect(CITATION_TIPO_META.normativa.badge).not.toMatch(/verificada/i);
  });
});
