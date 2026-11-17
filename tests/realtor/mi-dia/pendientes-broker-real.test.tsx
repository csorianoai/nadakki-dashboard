import { act, render, screen, waitFor } from "@testing-library/react";
import { MiDiaPanel } from "@/components/realtor/mi-dia/MiDiaPanel";

// E2E-REALTOR destapó que, sin DEMO, «Pendientes del broker» no salía nunca: solo lo abría la vista Broker del armazón,
// y ese selector existe únicamente con DEMO (PS-10). Con datos reales lo decide el rol broker_supervisor de /acceso.
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const okSec = (items: unknown[]) => ({ quality: "OK", count: items.length, items });
const BODY = {
  generated_at: "2000-01-01T00:00:00Z", scope: "supervisor",
  leads_sin_primera_respuesta: okSec([]),
  listings_con_requisitos_bloqueantes: okSec([]),
  broker_desk_pendientes: okSec([{ item_id: "00000000-0000-4000-8000-00000000d003", kind: "agent_activation", created_at: "2000-01-01T00:00:00Z" }]),
  visitas_del_dia: okSec([]),
};
function montar(roles: string[], demo = false) {
  mockApiFetch.mockImplementation(async (path: string) => {
    if (path === "/api/v1/realestate/acceso") return { status: 200, json: async () => ({ ok: true, roles, demo }) };
    if (path === "/api/v1/realestate/mi-dia") return { status: 200, json: async () => BODY };
    return { status: 404, json: async () => ({}) };
  });
  render(<MiDiaPanel />);
}
const settle = async () => {
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/realestate/mi-dia", expect.anything()));
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
};

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});

it("broker_supervisor con datos reales ve sus pendientes del broker sin tocar ningún selector", async () => {
  montar(["broker_supervisor"]);
  await settle();
  expect(await screen.findByTestId("mi-dia-desk")).toHaveTextContent("Activación de agente");
});

it("negativo: un agente no ve la sección aunque el cuerpo traiga pendientes", async () => {
  montar(["agent"]);
  await settle();
  expect(screen.queryByTestId("mi-dia-desk")).toBeNull();
});

it("negativo: sin roles legibles (fail-closed) tampoco", async () => {
  montar([]);
  await settle();
  expect(screen.queryByTestId("mi-dia-desk")).toBeNull();
});
