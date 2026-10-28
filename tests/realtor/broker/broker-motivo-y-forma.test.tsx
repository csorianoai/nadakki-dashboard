/**
 * ROP-UX-ROUTING, parte de Realtor (/realtor/broker), medido en staging 7dcc6c6 (build local, backend simulado):
 *   - /realtor/broker a un agente CON acceso a Real Estate le decía «Tu usuario no tiene acceso a Real Estate»;
 *   - /realtor/broker con broker_supervisor reventaba la pantalla («This page couldn't load») con un 200 incompleto
 *     (TypeError: Cannot read properties of undefined (reading 'length' / 'agent_activation')).
 */
import { render, screen, waitFor } from "@testing-library/react";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const res = (status: number, body: unknown = {}) => ({ status, json: async () => body });
beforeEach(() => { mockApiFetch.mockReset(); process.env.NEXT_PUBLIC_REALTOR_PANEL = "1"; delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO; });

function acceso(roles: string[], extra: Record<string, unknown> = {}) {
  mockApiFetch.mockImplementation(async (ruta: string) => {
    if (/\/acceso$/.test(ruta)) return res(200, { allowed: true, roles, demo: false, qa_reviewer: false, ...extra });
    return res(200, {});        // 200 con cuerpo vacío: la forma no es la del contrato
  });
}

describe("/realtor/broker: el mensaje dice el motivo verdadero", () => {
  it("negativo: un agente con acceso a Real Estate pero sin rol de broker no lee «no tiene acceso a Real Estate»", async () => {
    acceso(["agent"]);
    const { BrokerPanel } = require("@/components/realtor/broker/BrokerPanel");
    render(<BrokerPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-rol-broker"));
    const aviso = screen.getByTestId("realtor-notice");
    expect(aviso).toHaveTextContent(/broker/i);
    expect(aviso).not.toHaveTextContent(/no tiene acceso a Real Estate/);
  });

  it("broker_supervisor con respuestas 200 incompletas: aviso de error, sin reventar la pantalla", async () => {
    acceso(["broker_supervisor"]);
    const errores = jest.spyOn(console, "error").mockImplementation(() => {});
    const { BrokerPanel } = require("@/components/realtor/broker/BrokerPanel");
    expect(() => render(<BrokerPanel />)).not.toThrow();
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith(expect.stringMatching(/\/summary$/), expect.anything()));
    await waitFor(() => expect(screen.queryByText("Cargando…")).toBeNull());
    expect(screen.queryByTestId("brokerage-status")).toBeNull();      // nada se pinta con datos que no son del contrato
    errores.mockRestore();
  });
});

describe("cliente del broker: una respuesta 200 que no tiene la forma del contrato es un error, no datos", () => {
  const c = () => require("@/lib/realtor/broker/client");
  const enviar = (body: unknown) => async () => res(200, body) as unknown as Response;
  it.each([
    ["mesa", (e: never) => c().leerMesa(e), {}],
    ["resumen", (e: never) => c().leerResumen(e), { brokerage_status: "active" }],
    ["items", (e: never) => c().leerItems({}, e), { next_cursor: null }],
    ["item", (e: never) => c().leerItem("p1", e), { id: "p1" }],
  ])("%s incompleto → error", async (_n, leer, body) => {
    expect(await leer(enviar(body) as never)).toEqual({ estado: "error" });
  });
  it.each([
    ["mesa", (e: never) => c().leerMesa(e), { id: "d1", brokerage_id: "b1", created_at: "2026-10-01T00:00:00Z" }],
    ["resumen", (e: never) => c().leerResumen(e), { brokerage_status: "active", pending_by_kind: {}, agents_by_status: {}, supervised_agent_counts: [], generated_at: "2026-10-27T00:00:00Z" }],
    ["items", (e: never) => c().leerItems({}, e), { items: [{ id: "p1", kind: "operation_review", status: "pending", created_at: "2026-10-27T00:00:00Z" }], next_cursor: null }],
    ["item", (e: never) => c().leerItem("p1", e), { id: "p1", kind: "operation_review", status: "pending", created_at: "2026-10-27T00:00:00Z" }],
  ])("%s con la forma del contrato → ok", async (_n, leer, body) => {
    expect(await leer(enviar(body) as never)).toEqual({ estado: "ok", datos: body });
  });
});
