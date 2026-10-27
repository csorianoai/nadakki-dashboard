import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { BrokerPanel } from "@/components/realtor/broker/BrokerPanel";

// El panel QA se monta SOLO con qa_reviewer=true en /acceso (backend: journey/qa.habilitado, #2473). Contrato real de
// qa-decision y qa-decisions (#2463). La bandeja legal del broker no cambia.
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const revision = { id: "p1", kind: "operation_review", subject_label: "Operacion SYNTH", status: "pending", created_at: "2026-10-27T00:00:00Z" };
const activacion = { id: "a1", kind: "agent_activation", subject_label: "Agente", status: "pending", created_at: "2026-10-27T00:00:00Z" };
const res = (status: number, body: unknown = {}) => ({ status, json: async () => body });
const hist = [{ qa_decision: "return", reviewer_user_id: "u-paula", at: "2026-10-27T13:09:48Z" }];

type Montaje = { roles: string[]; qa: unknown; post?: { status: number; body: unknown } };
function montar({ roles, qa, post }: Montaje) {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  mockApiFetch.mockImplementation(async (ruta: string, init?: RequestInit) => {
    if (init?.method === "POST") return res(post?.status ?? 200, post?.body ?? {});
    if (/\/acceso$/.test(ruta)) return res(200, { allowed: true, roles, demo: false, ...(qa === undefined ? {} : { qa_reviewer: qa }) });
    if (/\/qa-decisions$/.test(ruta)) return res(200, { item_id: "p1", item_status: "pending", legal_effect: false, test: true, qa_decisions: hist });
    if (/\/items\/p1$/.test(ruta)) return res(200, revision);
    if (/\/items\?/.test(ruta)) return res(200, { items: [revision, activacion], next_cursor: null });
    if (/\/broker-desk$/.test(ruta)) return res(200, { id: "d1", brokerage_id: "b1", created_at: "2026-10-01T00:00:00Z" });
    if (/\/summary$/.test(ruta)) return res(200, { brokerage_status: "active", pending_by_kind: {}, agents_by_status: {}, supervised_agent_counts: [], generated_at: "2026-10-27T00:00:00Z" });
    return res(404);
  });
  return render(<BrokerPanel />);
}
const posts = () => mockApiFetch.mock.calls.filter(([, i]) => i?.method === "POST");
const llamo = (re: RegExp) => mockApiFetch.mock.calls.some(([r]) => re.test(String(r)));
const abrir = async () => { await userEvent.click((await screen.findAllByTestId("item-row"))[0]); await screen.findByTestId("item-detail"); };

beforeEach(() => { mockApiFetch.mockReset(); delete process.env.NEXT_PUBLIC_REALTOR_PANEL; delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO; });

describe("QA del broker: negativos primero", () => {
  it.each([
    ["Cesar (agent, qa_reviewer false)", ["agent"], false],
    ["X de otro tenant (agent, qa_reviewer false)", ["agent"], false],
    ["backend sin el campo qa_reviewer", ["agent"], undefined],
    ["qa_reviewer como texto", ["agent"], "true"],
    ["un rol llamado qa_reviewer no basta", ["qa_reviewer"], false],
  ] as const)("%s: sin panel QA, aviso sin-acceso y ninguna peticion qa-*", async (_n, roles, qa) => {
    montar({ roles: [...roles], qa });
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso"));
    expect(screen.queryByTestId("qa-panel")).toBeNull();
    expect(screen.queryByTestId("qa-label")).toBeNull();
    expect(llamo(/qa-/)).toBe(false);
  });

  it("B (broker_supervisor, qa_reviewer false) ve su bandeja legal y nada de QA", async () => {
    montar({ roles: ["broker_supervisor"], qa: false });
    await waitFor(() => expect(llamo(/\/items\?/)).toBe(true));
    expect(screen.queryByTestId("qa-panel")).toBeNull();
    expect(screen.queryByTestId("qa-label")).toBeNull();
    expect(llamo(/qa-/)).toBe(false);
  });

  it("sin el interruptor del panel no se pregunta nada", async () => {
    mockApiFetch.mockImplementation(async () => res(200, {}));
    render(<BrokerPanel />);
    expect(await screen.findByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it.each([[403, "qa-forbidden"], [404, "qa-error"], [409, "qa-conflict"], [422, "qa-invalid"]] as const)(
    "Paula-QA: el backend responde %s y se muestra %s; la revision sigue pending", async (status, id) => {
      montar({ roles: ["agent"], qa: true, post: { status, body: {} } });
      await abrir();
      await userEvent.click(screen.getByTestId("qa-reject"));
      expect(await screen.findByTestId(id)).toBeInTheDocument();
      expect(screen.getAllByTestId("item-row")[0]).toHaveAttribute("data-status", "pending");
    });
});

describe("QA del broker: Paula-QA (qa_reviewer true)", () => {
  it("ve «QA · sin efecto legal», los tres botones, solo las revisiones y el historial real; no ve la bandeja legal", async () => {
    montar({ roles: ["agent"], qa: true });
    expect(await screen.findByTestId("qa-label")).toHaveTextContent("QA · sin efecto legal");
    const filas = await screen.findAllByTestId("item-row");
    expect(filas).toHaveLength(1);                         // la activacion de agente no es una revision: no se lista
    await abrir();
    expect(screen.getByTestId("qa-approve")).toHaveTextContent("Aprobar");
    expect(screen.getByTestId("qa-return")).toHaveTextContent("Devolver");
    expect(screen.getByTestId("qa-reject")).toHaveTextContent("Rechazar (TEST)");
    expect(await screen.findByTestId("qa-history")).toHaveTextContent("Devuelta");
    expect(screen.queryByTestId("qa-reason")).toBeNull();   // el backend no admite reason
    expect(screen.queryByTestId("decision-approve")).toBeNull();
    expect(llamo(/\/broker-desk$/)).toBe(false);            // la bandeja legal (mesa) no se pide
  });

  it.each([["qa-approve", "approve"], ["qa-return", "return"], ["qa-reject", "reject"]] as const)(
    "%s hace POST .../qa-decision con {decision: %s} exacto y la revision sigue pending", async (boton, d) => {
      montar({ roles: ["agent"], qa: true, post: { status: 200, body: { item_id: "p1", qa_decision: d, item_status: "pending", legal_effect: false, test: true, qa_decisions: hist } } });
      await abrir();
      await userEvent.click(screen.getByTestId(boton));
      await waitFor(() => expect(posts()).toHaveLength(1));
      const [ruta, init] = posts()[0];
      expect(ruta).toMatch(/\/broker-desk\/items\/p1\/qa-decision$/);
      expect(JSON.parse(init.body)).toEqual({ decision: d });
      expect(llamo(/\/items\/p1\/decision$/)).toBe(false);
      await waitFor(() => expect(screen.getAllByTestId("item-row")[0]).toHaveAttribute("data-status", "pending"));
    });
});
