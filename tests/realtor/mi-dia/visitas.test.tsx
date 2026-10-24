import { act, render, screen, waitFor } from "@testing-library/react";
import { MiDiaPanel } from "@/components/realtor/mi-dia/MiDiaPanel";
import { miDiaEs } from "@/lib/realtor/mi-dia/copy";

// Solo se simula la red; la puerta de acceso (useRealtorAccessInfo) corre real.
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: (...a: unknown[]) => mockApiFetch(...a),
  getAuthHeaders: () => ({}),
}));

const okSec = (items: unknown[]) => ({ quality: "OK", count: items.length, items });
const visit = (over: Record<string, unknown> = {}) => ({ visit_id: "SYNTH-V1", listing_id: "SYNTH-P1", scheduled_at: "2000-01-01T15:30:00Z", status: "scheduled", ...over });
const body = (visitas: unknown) => ({
  generated_at: "2000-01-01T00:00:00Z", scope: "agent",
  leads_sin_primera_respuesta: okSec([]),
  listings_con_requisitos_bloqueantes: okSec([]),
  broker_desk_pendientes: okSec([]),
  visitas_del_dia: visitas,
});
const route = (miDia: { status: number; body?: unknown } | Error) =>
  mockApiFetch.mockImplementation(async (path: string) => {
    if (path === "/api/v1/realestate/acceso") return { status: 200, json: async () => ({}) };
    if (miDia instanceof Error) throw miDia;
    return { status: miDia.status, json: async () => miDia.body };
  });

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});
const settle = async () => {
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/realestate/mi-dia", expect.anything()));
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
};

describe("MiDiaPanel · visitas del día", () => {
  it.each([403, 404, 409, 422, 503])("negativo: mi-dia responde %s → sin filas de visitas y NO_DISPONIBLE", async (status) => {
    route({ status });
    render(<MiDiaPanel />);
    await settle();
    const sec = await screen.findByTestId("mi-dia-visitas");
    expect(sec.querySelector('[data-testid="mi-dia-row"]')).toBeNull();
    expect(sec.querySelector('[data-testid="mi-dia-no-disponible"]')).not.toBeNull();
    expect(screen.queryByTestId("mi-dia-visitas-count")).toBeNull();
  });
  it("negativo: fallo de red → NO_DISPONIBLE", async () => {
    route(new Error("net"));
    render(<MiDiaPanel />);
    await settle();
    expect(screen.getByTestId("mi-dia-visitas").querySelector('[data-testid="mi-dia-no-disponible"]')).not.toBeNull();
  });
  it("negativo: la petición no lleva tenant del cliente", async () => {
    route({ status: 200, body: body(okSec([])) });
    render(<MiDiaPanel />);
    await settle();
    const call = mockApiFetch.mock.calls.find((c) => c[0] === "/api/v1/realestate/mi-dia")!;
    expect(JSON.stringify(call).toLowerCase()).not.toMatch(/tenant/);
  });
  it("positivo: pinta las visitas con hora y cuenta", async () => {
    route({ status: 200, body: body(okSec([visit(), visit({ visit_id: "SYNTH-V2", status: "confirmed" })])) });
    render(<MiDiaPanel />);
    await settle();
    const sec = await screen.findByTestId("mi-dia-visitas");
    await waitFor(() => expect(screen.getByTestId("mi-dia-visitas-count")).toHaveTextContent("2"));
    expect(sec.querySelectorAll('[data-testid="mi-dia-row"]')).toHaveLength(2);
    expect(sec).toHaveTextContent(miDiaEs.visitStatus.confirmed);
    expect(sec).not.toHaveTextContent("scheduled");
  });
  it("positivo: sección sin visitas con quality OK muestra el vacío de visitas", async () => {
    route({ status: 200, body: { ...body(okSec([])), leads_sin_primera_respuesta: okSec([{ lead_id: "SYNTH-1", channel: "web", intent: "rent", status: "new", received_at: "2000-01-01T00:00:00Z", waiting_hours: 1 }]) } });
    render(<MiDiaPanel />);
    await settle();
    await waitFor(() => expect(screen.getByTestId("mi-dia-visitas-empty")).toHaveTextContent(miDiaEs.visitsEmpty));
  });
});
