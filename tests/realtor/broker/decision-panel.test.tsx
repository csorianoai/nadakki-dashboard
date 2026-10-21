import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { BrokerPanel } from "@/components/realtor/broker/BrokerPanel";
import { DEMO_ITEMS } from "@/lib/realtor/broker/demo";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const pendiente = { id: "p1", kind: "agent_activation", subject_label: "Ana", status: "pending", created_at: "2026-10-01T00:00:00Z" };
const decidida = { id: "d1", kind: "brand_publication", subject_label: "Marca", status: "approved", decision_reason: "ok", decided_at: "2026-10-02T00:00:00Z", created_at: "2026-10-01T00:00:00Z" };
const res = (status: number, body: unknown = {}) => ({ status, json: async () => body });

type Post = { status: number; body: unknown };
function montar(roles: string[], post: Post = { status: 200, body: { ...pendiente, status: "approved", decision_reason: "ok" } }) {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  mockApiFetch.mockImplementation(async (ruta: string, init?: RequestInit) => {
    if (init?.method === "POST") return res(post.status, post.body);
    if (/\/acceso/.test(ruta)) return res(200, { roles, demo: false });
    if (/\/items\/p1$/.test(ruta)) return res(200, pendiente);
    if (/\/items\/d1$/.test(ruta)) return res(200, decidida);
    if (/\/items\?/.test(ruta)) return res(200, { items: [pendiente, decidida], next_cursor: null });
    if (/\/summary$/.test(ruta)) return res(404);
    return res(404);
  });
  return render(<BrokerPanel />);
}
const posts = () => mockApiFetch.mock.calls.filter(([, i]) => i?.method === "POST");
const abrir = async (n: number) => { const f = await screen.findAllByTestId("item-row"); await userEvent.click(f[n]); await screen.findByTestId("item-detail"); };

beforeEach(() => { mockApiFetch.mockReset(); delete process.env.NEXT_PUBLIC_REALTOR_PANEL; delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO; });

describe("bandeja del broker: aprobar y devolver", () => {
  it("un item pending muestra Aprobar y Devolver; uno ya decidido no", async () => {
    montar(["broker_supervisor"]);
    await abrir(0);
    await screen.findByTestId("decision-approve");
    expect(screen.getByTestId("decision-reject")).toHaveTextContent("Devolver");
    await userEvent.click(screen.getAllByTestId("item-row")[1]);
    await waitFor(() => expect(screen.queryByTestId("decision-approve")).toBeNull());
    expect(screen.queryByTestId("decision-reject")).toBeNull();
  });

  it("sin motivo no se envia nada y se pide el motivo", async () => {
    montar(["broker_supervisor"]);
    await abrir(0);
    await userEvent.click(await screen.findByTestId("decision-approve"));
    expect(await screen.findByTestId("decision-reason-required")).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
  });

  it("aprobar con motivo hace POST /decision y refleja el nuevo estado", async () => {
    montar(["broker_supervisor"]);
    await abrir(0);
    await userEvent.type(await screen.findByTestId("decision-reason"), "todo en orden");
    await userEvent.click(screen.getByTestId("decision-approve"));
    await waitFor(() => expect(posts()).toHaveLength(1));
    const [ruta, init] = posts()[0];
    expect(ruta).toMatch(/\/broker-desk\/items\/p1\/decision$/);
    expect(JSON.parse(init.body)).toEqual({ decision: "approved", reason: "todo en orden" });
    await waitFor(() => expect(within(screen.getAllByTestId("item-row")[0]).getByText("Aprobada")).toBeInTheDocument());
    expect(screen.queryByTestId("decision-approve")).toBeNull();
  });

  it("devolver envia decision rejected", async () => {
    montar(["broker_supervisor"], { status: 200, body: { ...pendiente, status: "rejected", decision_reason: "falta" } });
    await abrir(0);
    await userEvent.type(await screen.findByTestId("decision-reason"), "falta documento");
    await userEvent.click(screen.getByTestId("decision-reject"));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(JSON.parse(posts()[0][1].body)).toEqual({ decision: "rejected", reason: "falta documento" });
    await waitFor(() => expect(within(screen.getAllByTestId("item-row")[0]).getByText("Rechazada")).toBeInTheDocument());
  });

  it.each([[409, "decision-conflict"], [403, "decision-forbidden"], [422, "decision-invalid"], [500, "decision-error"]])(
    "el backend responde %s: se muestra %s y el item sigue pending", async (status, testid) => {
      montar(["broker_supervisor"], { status, body: { detail: "x" } });
      await abrir(0);
      await userEvent.type(await screen.findByTestId("decision-reason"), "motivo");
      await userEvent.click(screen.getByTestId("decision-approve"));
      expect(await screen.findByTestId(testid)).toBeInTheDocument();
      expect(within(screen.getAllByTestId("item-row")[0]).getByText("Pendiente")).toBeInTheDocument();
    });

  it("sin el rol broker_supervisor no hay bandeja ni POST (la puerta real, sin simular)", async () => {
    montar(["tenant_owner"]);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).toBeInTheDocument());
    expect(screen.queryByTestId("broker-panel")).toBeNull();
    expect(posts()).toHaveLength(0);
  });

  it("en DEMO no hay botones de decision ni POST", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    mockApiFetch.mockImplementation(async (ruta: string) => (/\/acceso/.test(ruta) ? res(200, { roles: ["broker_supervisor"], demo: true }) : res(404)));
    render(<BrokerPanel />);
    const filas = await screen.findAllByTestId("item-row");
    expect(filas.length).toBe(DEMO_ITEMS.length);
    await userEvent.click(filas[0]);
    await screen.findByTestId("item-detail");
    expect(screen.queryByTestId("decision-approve")).toBeNull();
    expect(posts()).toHaveLength(0);
  });
});
