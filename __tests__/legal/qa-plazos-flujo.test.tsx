/**
 * Recorrido QA 23-nov-2026: flujo de plazos del abogado.
 * - «Calcular plazos» llevaba a una pantalla sin formulario.
 * - No había forma de registrar el plazo que fija el tribunal ni de marcarlo cumplido.
 * - Tras subir una notificación con fecha no se ofrecía calcular nada.
 * - El cambio de estado usaba window.prompt y bloqueaba la página.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch-client";
import { CaseDeadlinesCalculator } from "@/components/legal/cases/CaseDeadlinesCalculator";
import { CaseDeadlinesPanel, nombreDelPlazo } from "@/components/legal/cases/CaseDeadlinesPanel";
import { CaseDocumentUploader } from "@/components/legal/cases/CaseDocumentUploader";
import { CaseActionsMenu } from "@/components/legal/cases/CaseActionsMenu";
import type { CaseDeadline, CaseDocument } from "@/lib/legal/cases/case-types";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const http = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body), json: async () => body }) as Response;
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/app/providers/DisasterModeProvider", () => ({ useDisasterLevel: () => "NORMAL" }));
const runTransition = jest.fn();
jest.mock("@/hooks/legal/useCaseActions", () => ({
  useCaseActions: () => ({
    data: { available_actions: [], transitions_available: ["TRIAGE"] },
    isLoading: false, runAction: jest.fn(), runTransition, running: false,
  }),
}));

const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

const APELACION = {
  deadline_db_id: "CIVIL-APELACION-001", categoria: "CIVIL", procedimiento: "apelacion",
  descripcion: "Recurso de apelación", corre_desde: "Desde la notificación de la sentencia por acto de alguacil",
  valor: 1, unidad: "mes", base_legal: "Art. 443 CPC (mod. Ley 845-78)", perentorio: true, notas: null,
};
const DOCS = [{ document_id: "doc-1", title: "sentencia.pdf" } as CaseDocument];

const cuerpos = () =>
  fetchMock.mock.calls
    .filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")
    .map(([url, init]) => ({ url: String(url), body: JSON.parse(String((init as RequestInit).body)) }));

beforeEach(() => { jest.clearAllMocks(); });

describe("Calcular plazo con la fecha real", () => {
  it("lista el catálogo, explica desde cuándo corre y envía plazo + fecha + documento", async () => {
    fetchMock.mockImplementation(async (url) =>
      String(url).endsWith("/deadlines/catalog") ? http(200, { plazos: [APELACION] }) : http(200, { status: "deadlines_computed", computed: ["CIVIL-APELACION-001"], skipped: [] }));
    wrap(<CaseDeadlinesCalculator tenantId="t" caseId="c1" documents={DOCS} fechaInicial="2026-12-20" docInicial="doc-1" />);
    await screen.findByRole("option", { name: /Apelacion — 1 mes/ });
    await userEvent.selectOptions(screen.getByLabelText("Plazo"), "CIVIL-APELACION-001");
    expect(screen.getByText(/notificación de la sentencia por acto de alguacil/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha del hecho/)).toHaveValue("2026-12-20");
    await userEvent.click(screen.getByRole("button", { name: "Calcular plazo" }));
    await screen.findByText(/Plazo calculado/);
    expect(cuerpos()).toEqual([{ url: "/api/legal/cases/c1/actions", body: expect.objectContaining({
      action: "compute_deadlines",
      payload: { deadline_db_id: "CIVIL-APELACION-001", trigger_date: "2026-12-20", trigger_document_id: "doc-1" },
    }) }]);
  });

  it("muestra el mensaje del backend si falta la fecha y no dice que se guardó", async () => {
    fetchMock.mockImplementation(async (url) =>
      String(url).endsWith("/deadlines/catalog") ? http(200, { plazos: [APELACION] })
        : http(422, { detail: { codigo: "FECHA_DEL_HECHO_REQUERIDA", mensaje: "compute_deadlines requiere la fecha real" } }));
    wrap(<CaseDeadlinesCalculator tenantId="t" caseId="c1" documents={[]} fechaInicial="2026-12-20" />);
    await screen.findByRole("option", { name: /Apelacion — 1 mes/ });
    await userEvent.selectOptions(screen.getByLabelText("Plazo"), "CIVIL-APELACION-001");
    await userEvent.click(screen.getByRole("button", { name: "Calcular plazo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("requiere la fecha real");
    expect(screen.queryByText(/Plazo calculado/)).toBeNull();
  });

  it("registra un plazo fijado por el tribunal", async () => {
    fetchMock.mockImplementation(async (url) =>
      String(url).endsWith("/deadlines/catalog") ? http(200, { plazos: [] }) : http(200, { status: "deadline_added" }));
    wrap(<CaseDeadlinesCalculator tenantId="t" caseId="c1" documents={[]} />);
    expect(await screen.findByText(/no tiene plazos legales para esta materia/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Plazo fijado por el tribunal" }));
    await userEvent.type(screen.getByLabelText("Qué hay que hacer"), "Depositar escrito de réplica");
    await userEvent.type(screen.getByLabelText("Fecha de la audiencia o resolución"), "2026-11-25");
    await userEvent.type(screen.getByLabelText("Fecha límite"), "2026-12-10");
    await userEvent.click(screen.getByRole("button", { name: "Registrar plazo" }));
    await screen.findByText("Plazo del tribunal registrado.");
    expect(cuerpos()[0].body).toEqual(expect.objectContaining({
      action: "add_manual_deadline",
      payload: { descripcion: "Depositar escrito de réplica", fecha_resolucion: "2026-11-25", fecha_limite: "2026-12-10", perentorio: true },
    }));
  });
});

describe("Lista de plazos", () => {
  const base = {
    deadline_id: "d1", deadline_db_id: "TRIBUNAL-FIJADO", deadline_category: "TRIBUNAL", notes: "Depositar escrito de réplica",
    trigger_event: "Audiencia", trigger_date: "2026-11-25", auto_calculated_deadline_date: "2026-12-10",
    has_human_override: false, effective_deadline_date: "2026-12-10", status: "active", legal_basis: "Fijado por el tribunal",
    is_peremptory: true, is_extendable: false,
  } as CaseDeadline;

  it("nombra el plazo del tribunal por lo que hay que hacer y el del catálogo por su acto", () => {
    expect(nombreDelPlazo(base)).toBe("Depositar escrito de réplica");
    expect(nombreDelPlazo({ ...base, deadline_category: "CIVIL", deadline_sub_category: "apelacion" })).toBe("Apelación");
  });

  it("sin plazos lo dice; «Marcar cumplido» envía complete_deadline", async () => {
    const { unmount } = wrap(<CaseDeadlinesPanel deadlines={[]} caseId="c1" tenantId="t" />);
    expect(screen.getByText(/aún no tiene plazos/)).toBeInTheDocument();
    unmount();
    fetchMock.mockResolvedValue(http(200, { status: "deadline_completed" }));
    const listo = jest.fn();
    wrap(<CaseDeadlinesPanel deadlines={[base]} caseId="c1" tenantId="t" onOverridden={listo} />);
    await userEvent.click(screen.getByRole("button", { name: "Marcar cumplido" }));
    await waitFor(() => expect(listo).toHaveBeenCalled());
    expect(cuerpos()[0].body).toEqual(expect.objectContaining({ action: "complete_deadline", payload: { deadline_id: "d1" } }));
  });
});

describe("Subir notificación con fecha", () => {
  it("ofrece calcular los plazos que abre y limpia el formulario", async () => {
    fetchMock.mockImplementation(async (url) =>
      String(url).includes("documents-storage") ? http(200, { disponible: true, motivo: null, max_mb: 15, tipos: [] })
        : http(201, { document_id: "doc-9" }));
    wrap(<CaseDocumentUploader tenantId="t" caseId="c1" onUploaded={jest.fn()} />);
    const f = new File(["%PDF-1.4"], "notif.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText(/Archivo/), f);
    await userEvent.selectOptions(screen.getByLabelText("Tipo de documento"), "notificacion");
    await userEvent.type(screen.getByLabelText(/Fecha de notificación/), "2026-11-18");
    await userEvent.click(screen.getByRole("button", { name: "Subir documento" }));
    const enlace = await screen.findByRole("link", { name: /Calcular los plazos que abre/ });
    expect(enlace).toHaveAttribute("href", "/legal/cases/c1/deadlines?fecha=2026-11-18&doc=doc-9");
    expect(screen.getByLabelText("Tipo de documento")).toHaveValue("");
  });
});

describe("Cambio de estado sin ventana del navegador", () => {
  it("pide el motivo en la página, no con window.prompt", async () => {
    const prompt = jest.spyOn(window, "prompt");
    wrap(<CaseActionsMenu tenantId="t" caseId="c1" />);
    await userEvent.click(screen.getByRole("button", { name: /→/ }));
    expect(prompt).not.toHaveBeenCalled();
    const confirmar = screen.getByRole("button", { name: "Confirmar" });
    expect(confirmar).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Motivo para pasar/), "Se notificó la sentencia");
    await userEvent.click(confirmar);
    expect(runTransition).toHaveBeenCalledWith({ newState: "TRIAGE", reason: "Se notificó la sentencia" });
  });
});

describe("pulido ronda 2", () => {
  const base = {
    deadline_id: "d2", deadline_db_id: "CIVIL-APELACION-001", deadline_category: "CIVIL", deadline_sub_category: "apelacion",
    trigger_event: "x", trigger_date: "2026-11-18", auto_calculated_deadline_date: "2026-12-21", has_human_override: false,
    effective_deadline_date: "2026-12-21", status: "completed", legal_basis: "Art. 443 CPC", is_peremptory: true, is_extendable: false,
  } as CaseDeadline;
  it("acto con tilde y, si está cumplido, sin botones de IA ni estrategia", () => {
    expect(nombreDelPlazo(base)).toBe("Apelación");
    wrap(<CaseDeadlinesPanel deadlines={[base]} caseId="c1" tenantId="t" />);
    expect(screen.queryByRole("link", { name: "Preparar escrito con IA" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Marcar cumplido" })).toBeNull();
  });
  it("el plazo del tribunal dice «Fijado por el tribunal»", () => {
    wrap(<CaseDeadlinesPanel deadlines={[{ ...base, deadline_category: "TRIBUNAL", notes: "Depositar réplica", status: "active" }]} caseId="c1" tenantId="t" />);
    expect(screen.getByText("Fijado por el tribunal")).toBeInTheDocument();
  });
});
