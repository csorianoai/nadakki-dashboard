/**
 * NADAKKI Legal OS — "Mi despacho": cifras honestas.
 * Los cuerpos imitan el contrato de los PRs de backend #2857 (cola) y #2858 (plazos),
 * y el de un backend anterior sin esos campos. Solo se simula el transporte.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { apiFetch } from "@/lib/api/fetch-client";
import { fetchValidationQueue, fetchValidationQueueSummary } from "@/lib/legal/validation-queue-api";
import { systemState } from "@/components/legal/LegalStatusStrip";
import { formatDeadlineDate, sortDeadlines, PriorityDeadlinesPanel } from "@/components/legal/home/PriorityDeadlinesPanel";
import { HomeKpiTiles } from "@/components/legal/home/HomeKpiTiles";
import type { UpcomingDeadline } from "@/hooks/legal/useUpcomingDeadlines";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const http = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body), json: async () => body }) as Response;

jest.mock("@/hooks/legal/useUpcomingDeadlines", () => ({ useUpcomingDeadlines: jest.fn() }));
jest.mock("@/hooks/legal/useValidationQueue", () => ({ useValidationQueue: jest.fn(), useValidationQueueSummary: jest.fn() }));
jest.mock("@/hooks/legal/useHearings", () => ({ useHearingsList: jest.fn() }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));
import { useUpcomingDeadlines } from "@/hooks/legal/useUpcomingDeadlines";
import { useValidationQueue, useValidationQueueSummary } from "@/hooks/legal/useValidationQueue";
import { useHearingsList } from "@/hooks/legal/useHearings";

const plazo = (o: Partial<UpcomingDeadline>): UpcomingDeadline => ({
  deadline_id: "d", case_id: "c1", case_title: "Cobro de pesos QA", case_number_internal: "N-1", deadline_db_id: "X",
  deadline_category: "CIVIL", deadline_sub_category: "Apelación", trigger_event: "", effective_deadline_date: "2026-11-25",
  auto_calculated_deadline_date: "2026-11-25", legal_basis: "Art. 443 CPC", is_peremptory: false, status: "active",
  acknowledged_at: null, acknowledged_by: null, ...o,
});

beforeEach(() => jest.clearAllMocks());

describe("cola de revisión: totales del servidor", () => {
  it("usa total y has_more del backend nuevo y pide solo estados abiertos", async () => {
    fetchMock.mockResolvedValueOnce(http(200, { items: [{ queue_item_id: "q", case_id: "c" }], count: 1, total: 205, has_more: true }));
    const r = await fetchValidationQueue("t");
    expect(r).toMatchObject({ count: 1, total: 205, hasMore: true });
    expect(String(fetchMock.mock.calls[0][0])).toContain("status=pending%2Cassigned%2Cin_review");
  });

  it("backend anterior sin total: total desconocido; parcial solo si la página se llenó", async () => {
    fetchMock.mockResolvedValueOnce(http(200, { items: [{ queue_item_id: "q", case_id: "c" }], count: 1 }));
    expect(await fetchValidationQueue("t", 200)).toMatchObject({ total: null, hasMore: false });
  });

  it("summary inexistente (404) no es un error ni un cero", async () => {
    fetchMock.mockResolvedValueOnce(http(404, { detail: "Not Found" }));
    expect(await fetchValidationQueueSummary("t")).toBeNull();
  });

  it("summary sin perfil de abogado: assigned_to_me queda null, nunca 0", async () => {
    fetchMock.mockResolvedValueOnce(http(200, { total_open: 3, overdue: 1, critical: 0, high: 1, unassigned: 2, assigned_to_me: null, attorney_profile: false, as_of: "2026-11-22T15:00:00Z" }));
    expect(await fetchValidationQueueSummary("t")).toMatchObject({ total_open: 3, assigned_to_me: null, attorney_profile: false });
  });
});

describe("estado del sistema", () => {
  it("sin dato o con error es 'sin información', no 'degradado'", () => {
    expect(systemState(undefined, false)).toBe("unknown");
    expect(systemState("healthy", true)).toBe("unknown");
    expect(systemState("healthy", false)).toBe("ok");
    expect(systemState("degraded", false)).toBe("degraded");
  });
});

describe("plazos", () => {
  it("la fecha DATE no se corre un día por zona horaria", () => {
    expect(formatDeadlineDate("2026-11-25")).toMatch(/25/);
    expect(formatDeadlineDate("")).toBe("—");
  });

  it("vencidos primero, luego perentorios, luego por fecha", () => {
    const orden = sortDeadlines([
      plazo({ deadline_id: "normal", effective_deadline_date: "2026-11-23" }),
      plazo({ deadline_id: "perentorio", is_peremptory: true, effective_deadline_date: "2026-11-28" }),
      plazo({ deadline_id: "vencido", overdue: true, effective_deadline_date: "2026-11-20" }),
    ]).map((d) => d.deadline_id);
    expect(orden).toEqual(["vencido", "perentorio", "normal"]);
  });

  it("muestra fundamento, vencido, perentorio y 'regla no verificada' salvo catálogo validado", () => {
    (useUpcomingDeadlines as jest.Mock).mockReturnValue({ isLoading: false, error: null, data: { include_overdue: true, deadlines: [
      plazo({ deadline_id: "a", overdue: true, is_peremptory: true, catalog_validated: null }),
      plazo({ deadline_id: "b", case_title: "Laboral", catalog_validated: true, has_human_override: true }),
    ] } });
    render(<PriorityDeadlinesPanel tenantId="t" />);
    expect(screen.getAllByText(/Art. 443 CPC/)).toHaveLength(2);
    expect(screen.getByText("Vencido")).toBeInTheDocument();
    expect(screen.getByText("Perentorio")).toBeInTheDocument();
    expect(screen.getByText("Ajustado por abogado")).toBeInTheDocument();
    expect(screen.getAllByText("Regla no verificada")).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /Abrir plazos/ })[0]).toHaveAttribute("href", "/legal/cases/c1/deadlines");
  });

  it("si el servidor no confirma los vencidos, la lista vacía no dice 'no hay vencidos'", () => {
    (useUpcomingDeadlines as jest.Mock).mockReturnValue({ isLoading: false, error: null, data: { deadlines: [] } });
    render(<PriorityDeadlinesPanel tenantId="t" />);
    expect(screen.getByText(/no confirma si hay plazos vencidos/)).toBeInTheDocument();
  });
});

describe("indicadores de Mi despacho", () => {
  const base = () => {
    (useUpcomingDeadlines as jest.Mock).mockReturnValue({ isLoading: false, error: null, data: { include_overdue: true, deadlines: [plazo({ overdue: true })] } });
    (useHearingsList as jest.Mock).mockReturnValue({ isLoading: false, error: null, data: { hearings: [], total: 2 } });
  };

  it("revisiones: total del servidor y asignadas a ti cuando hay perfil", () => {
    base();
    (useValidationQueue as jest.Mock).mockReturnValue({ loading: false, forbidden: false, partial: true, openCount: null, open: [] });
    (useValidationQueueSummary as jest.Mock).mockReturnValue({ loading: false, summary: { total_open: 205, overdue: 0, assigned_to_me: 4, attorney_profile: true } });
    render(<HomeKpiTiles tenantId="t" casesTotal={12} casesLoading={false} />);
    expect(screen.getByTestId("kpi-revisiones")).toHaveTextContent("205");
    expect(screen.getByTestId("kpi-revisiones")).toHaveTextContent("4 asignada(s) a ti");
    expect(screen.getByTestId("kpi-plazos")).toHaveTextContent("1 vencido(s) sin acusar");
    expect(screen.getByTestId("kpi-audiencias")).toHaveTextContent("2");
    expect(screen.getByTestId("kpi-expedientes")).toHaveTextContent("12");
  });

  it("sin total confirmado ni summary: '—' y vista parcial, nunca un número tranquilizador", () => {
    base();
    (useValidationQueue as jest.Mock).mockReturnValue({ loading: false, forbidden: false, partial: true, openCount: null, open: [] });
    (useValidationQueueSummary as jest.Mock).mockReturnValue({ loading: false, summary: null });
    render(<HomeKpiTiles tenantId="t" casesTotal={null} casesLoading={false} />);
    expect(screen.getByTestId("kpi-revisiones")).toHaveTextContent("—");
    expect(screen.getByTestId("kpi-revisiones")).toHaveTextContent("Vista parcial");
    expect(screen.getByTestId("kpi-expedientes")).toHaveTextContent("—");
  });

  it("sin perfil de abogado no muestra asignaciones", () => {
    base();
    (useValidationQueue as jest.Mock).mockReturnValue({ loading: false, forbidden: false, partial: false, openCount: 3, open: [] });
    (useValidationQueueSummary as jest.Mock).mockReturnValue({ loading: false, summary: { total_open: 3, overdue: 0, assigned_to_me: null, attorney_profile: false } });
    render(<HomeKpiTiles tenantId="t" casesTotal={1} casesLoading={false} />);
    expect(screen.getByTestId("kpi-revisiones")).toHaveTextContent("Sin perfil de abogado");
  });
});
