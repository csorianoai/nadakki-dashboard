/**
 * Bandeja de prioridades unificada (revisión de César del PR #1320): plazos, audiencias y revisiones en una lista,
 * cada uno con su acción; sin afirmar «nada urgente» cuando una fuente falla.
 */
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { desdeAudiencia, desdePlazo, desdeRevision, ordenarPrioridades } from "@/lib/legal/home/bandeja-prioridades";

jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));

const plazos = jest.fn();
const audiencias = jest.fn();
const cola = jest.fn();
jest.mock("@/hooks/legal/useUpcomingDeadlines", () => ({ useUpcomingDeadlines: () => plazos() }));
jest.mock("@/hooks/legal/useHearings", () => ({ useHearingsList: () => audiencias() }));
jest.mock("@/hooks/legal/useValidationQueue", () => ({ useValidationQueue: () => cola() }));

import { PriorityInbox } from "@/components/legal/home/PriorityInbox";

const plazo = (o: Record<string, unknown> = {}) => ({
  deadline_id: "d1", case_id: "c1", case_title: "Cobro QA", case_number_internal: "N1", deadline_db_id: "X",
  deadline_category: "Recurso de apelación", deadline_sub_category: "", trigger_event: "", effective_deadline_date: "2026-11-24",
  auto_calculated_deadline_date: "2026-11-24", legal_basis: "CPC art. 443", is_peremptory: true, status: "pending",
  acknowledged_at: null, acknowledged_by: null, catalog_validated: true, ...o,
});
const audiencia = { id: "h1", tenant_id: "t", case_id: "c1", external_ref: null, title: "Audiencia de conciliación", description: null,
  hearing_type: "x", status: "scheduled", hearing_date: "2026-11-27T14:00:00Z", duration_minutes: 60, location: "Cámara Civil", courtroom: "Sala 3",
  judge_name: null, jurisdiction: "do", timezone: "America/Santo_Domingo" };
const revision = { queue_item_id: "q1", case_id: "c2", document_id: "doc", priority: "high", status: "pending",
  sla_deadline: "2026-11-25T18:00:00Z", sla_breached: false, assigned_to: null, created_at: null };
const casos = [{ case_id: "c1", title: "Cobro QA" }, { case_id: "c2", title: "Contrato local" }] as never[];
const ok = (data: unknown) => ({ data, isLoading: false, error: null });

beforeEach(() => {
  plazos.mockReturnValue(ok({ deadlines: [plazo(), plazo({ deadline_id: "d0", effective_deadline_date: "2026-11-01", overdue: true, is_peremptory: false })] }));
  audiencias.mockReturnValue(ok({ hearings: [audiencia], total: 1 }));
  cola.mockReturnValue({ open: [revision], loading: false, forbidden: false, error: false });
});

describe("lógica", () => {
  it("vencidos primero, luego por fecha; cada tipo con su acción real", () => {
    const xs = ordenarPrioridades([
      desdeAudiencia(audiencia as never, () => "Cobro QA"),
      desdeRevision(revision as never, () => "Contrato local"),
      desdePlazo(plazo() as never),
      desdePlazo(plazo({ deadline_id: "d0", effective_deadline_date: "2026-11-01", overdue: true }) as never),
    ]);
    expect(xs.map((x) => x.id)).toEqual(["plazo-d0", "plazo-d1", "revision-q1", "audiencia-h1"]);
    expect(xs.find((x) => x.tipo === "revision")!.accion).toEqual({ label: "Revisar documento", href: "/legal/cases/c2/documents" });
    expect(xs.find((x) => x.tipo === "audiencia")!.accion.href).toBe("/legal/cases/c1");
    expect(xs[0]!.accion.href).toBe("/legal/cases/c1/deadlines");
  });

  it("audiencia sin expediente lleva a la agenda", () => {
    expect(desdeAudiencia({ ...audiencia, case_id: null } as never, () => null).accion).toEqual({ label: "Ver agenda", href: "/legal/audiencias" });
  });
});

describe("panel", () => {
  it("muestra los tres tipos con contadores y filtra por tipo", () => {
    render(<PriorityInbox tenantId="t" casos={casos} />);
    expect(screen.getByRole("button", { name: "Todo (4)" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: /Revisar documento — Contrato local/ })).toHaveAttribute("href", "/legal/cases/c2/documents");
    fireEvent.click(screen.getByRole("button", { name: "Audiencias (1)" }));
    const lista = screen.getByRole("list");
    expect(within(lista).getAllByRole("listitem")).toHaveLength(1);
    expect(within(lista).getByText("Audiencia de conciliación")).toBeInTheDocument();
  });

  it("si falla una fuente no dice «nada urgente» y explica cuál falló", () => {
    plazos.mockReturnValue({ data: undefined, isLoading: false, error: new Error("502") });
    audiencias.mockReturnValue(ok({ hearings: [], total: 0 }));
    cola.mockReturnValue({ open: [], loading: false, forbidden: false, error: false });
    render(<PriorityInbox tenantId="t" casos={casos} />);
    expect(screen.queryByText(/Nada urgente/)).toBeNull();
    expect(screen.getByText(/No se puede confirmar que no haya nada urgente/)).toBeInTheDocument();
    expect(screen.getByText(/No se pudieron cargar los plazos/)).toBeInTheDocument();
  });

  it("sin rol de abogado: sin revisiones y con la explicación, sin tratarlo como fallo", () => {
    cola.mockReturnValue({ open: [], loading: false, forbidden: true, error: false });
    render(<PriorityInbox tenantId="t" casos={casos} />);
    expect(screen.getByText(/solo se muestran a abogados validadores/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revisiones (0)" })).toBeInTheDocument();
  });

  it("todo vacío y sin fallos: «Nada urgente»", () => {
    plazos.mockReturnValue(ok({ deadlines: [] }));
    audiencias.mockReturnValue(ok({ hearings: [], total: 0 }));
    cola.mockReturnValue({ open: [], loading: false, forbidden: false, error: false });
    render(<PriorityInbox tenantId="t" casos={casos} />);
    expect(screen.getByText(/Nada urgente/)).toBeInTheDocument();
  });
});

describe("Preparar escrito con IA", () => {
  it("avisa que el asistente no recibe el expediente", () => {
    const { CaseDeadlinesPanel } = jest.requireActual("@/components/legal/cases/CaseDeadlinesPanel");
    const d = { deadline_id: "d1", deadline_db_id: "X", deadline_category: "Recurso de apelación", trigger_event: "", trigger_date: "",
      auto_calculated_deadline_date: "2099-01-01", has_human_override: false, effective_deadline_date: "2099-01-01", status: "active",
      legal_basis: "Ley", is_peremptory: false, is_extendable: false };
    render(<CaseDeadlinesPanel deadlines={[d]} caseId="c1" tenantId="t1" />);
    const link = screen.getByRole("link", { name: "Preparar escrito con IA" });
    expect(link).toHaveAccessibleDescription(/no recibe este expediente/);
  });
});
