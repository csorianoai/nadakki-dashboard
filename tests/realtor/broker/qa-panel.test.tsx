import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { BrokerPanel } from "@/components/realtor/broker/BrokerPanel";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const pendiente = { id: "p1", kind: "agent_activation", subject_label: "Ana", status: "pending", created_at: "2026-10-01T00:00:00Z" };
const res = (status: number, body: unknown = {}) => ({ status, json: async () => body });
const hist = [{ decision: "returned", reason: "falta documento", decided_at: "2026-10-26T00:00:00Z" }];

function montar(roles: string[], post = { status: 200, body: { ...pendiente, status: "approved" } }) {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  mockApiFetch.mockImplementation(async (ruta: string, init?: RequestInit) => {
    if (init?.method === "POST") return res(post.status, post.body);
    if (/\/acceso/.test(ruta)) return res(200, { roles, demo: false });
    if (/\/qa-history$/.test(ruta)) return res(200, { entries: hist });
    if (/\/items\/p1$/.test(ruta)) return res(200, pendiente);
    if (/\/items\?/.test(ruta)) return res(200, { items: [pendiente], next_cursor: null });
    return res(404);
  });
  return render(<BrokerPanel />);
}
const posts = () => mockApiFetch.mock.calls.filter(([, i]) => i?.method === "POST");
const llamo = (re: RegExp) => mockApiFetch.mock.calls.some(([r]) => re.test(String(r)));
const abrir = async () => { await userEvent.click((await screen.findAllByTestId("item-row"))[0]); await screen.findByTestId("item-detail"); };

beforeEach(() => { mockApiFetch.mockReset(); delete process.env.NEXT_PUBLIC_REALTOR_PANEL; delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO; });

describe("QA del broker: negativos primero", () => {
  it.each([[[]], [["broker_supervisor"]], [["sales_associate"]]] as const)("sin el rol qa_reviewer (%j) no aparece nada de QA", async (roles) => {
    montar([...roles]);
    await screen.findByTestId(roles.length && roles[0] === "broker_supervisor" ? "broker-panel" : "realtor-notice").catch(() => undefined);
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
    expect(screen.queryByTestId("qa-label")).toBeNull();
    expect(screen.queryByTestId("qa-approve")).toBeNull();
    expect(screen.queryByTestId("qa-panel")).toBeNull();
    expect(llamo(/qa-/)).toBe(false);
  });

  it.each([[403, "qa-forbidden"], [404, "qa-error"], [409, "qa-conflict"], [422, "qa-invalid"]] as const)(
    "el backend responde %s y se muestra %s sin cambiar el item", async (status, id) => {
      montar(["qa_reviewer"], { status, body: {} });
      await abrir();
      await userEvent.type(await screen.findByTestId("qa-reason"), "motivo");
      await userEvent.click(screen.getByTestId("qa-reject"));
      expect(await screen.findByTestId(id)).toBeInTheDocument();
      expect(screen.getAllByTestId("item-row")[0]).toHaveAttribute("data-status", "pending");
    });

  it("sin motivo no se envia nada", async () => {
    montar(["qa_reviewer"]);
    await abrir();
    await userEvent.click(await screen.findByTestId("qa-approve"));
    expect(await screen.findByTestId("qa-reason-required")).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
  });
});

describe("QA del broker: revisor QA", () => {
  it("ve el rotulo «QA · sin efecto legal», los tres botones y el historial", async () => {
    montar(["qa_reviewer"]);
    expect(await screen.findByTestId("qa-label")).toHaveTextContent("QA · sin efecto legal");
    await abrir();
    expect(await screen.findByTestId("qa-approve")).toHaveTextContent("Aprobar");
    expect(screen.getByTestId("qa-return")).toHaveTextContent("Devolver");
    expect(screen.getByTestId("qa-reject")).toHaveTextContent("Rechazar (TEST)");
    expect(await screen.findByTestId("qa-history")).toHaveTextContent("falta documento");
    expect(screen.queryByTestId("decision-approve")).toBeNull();
  });

  it("Devolver hace POST .../qa-decision con returned y recarga el historial", async () => {
    montar(["qa_reviewer"], { status: 200, body: { ...pendiente, status: "pending" } });
    await abrir();
    await userEvent.type(await screen.findByTestId("qa-reason"), "faltan datos");
    await userEvent.click(screen.getByTestId("qa-return"));
    await waitFor(() => expect(posts()).toHaveLength(1));
    const [ruta, init] = posts()[0];
    expect(ruta).toMatch(/\/broker-desk\/items\/p1\/qa-decision$/);
    expect(JSON.parse(init.body)).toEqual({ decision: "returned", reason: "faltan datos" });
    expect(posts().every(([r]) => !/\/decision$/.test(String(r)) || /qa-decision$/.test(String(r)))).toBe(true);
  });
});
