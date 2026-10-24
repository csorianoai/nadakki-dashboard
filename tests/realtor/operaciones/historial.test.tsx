import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/react";
import { OperacionGestion } from "@/components/realtor/operaciones/OperacionGestion";
import { fetchDetail } from "@/components/realtor/operaciones/escritura";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const res = (status: number, body: unknown = {}) => ({ status, json: async () => body });
const U = "11111111-2222-4333-8444-555555555555";
const ms = [{ id: "m1", label: "Documentos", position: 1, required: true, status: "done" }, { id: "m2", label: "Firma", position: 2, required: true, status: "pending" }];
const OPS = [{ id: "o1", code: "Alquiler o1", kind: "alquiler", stage: null, summary: { es: "x", en: "x" } }] as const;
const serve = (events?: unknown, status = 200) =>
  mockApiFetch.mockImplementation(async (path: string, init: { method?: string }) => {
    if (path.includes("/operation-templates")) return res(200, { items: [], next_cursor: null });
    if (init.method === "GET") return status === 200 ? res(200, { operation: { id: "o1", status: "in_progress" }, milestones: ms, ...(events === undefined ? {} : { milestone_events: events }) }) : res(status);
    return res(200);
  });
const abrir = async () => { render(<OperacionGestion ops={[...OPS]} />); await userEvent.click(await screen.findByRole("button", { name: /gestionar/i })); };

beforeEach(() => mockApiFetch.mockReset());

describe("historial de etapas (G6)", () => {
  it("403 al leer la operación: no muestra historial y avisa", async () => {
    serve(undefined, 403);
    await abrir();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByTestId("historial-etapas")).toBeNull();
  });
  it("404 al leer la operación: no muestra historial", async () => {
    serve(undefined, 404);
    await abrir();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/historial/i)).toBeNull();
  });
  it("sin eventos no inventa quién ni cuándo", async () => {
    serve([]);
    await abrir();
    const h = await screen.findByTestId("historial-etapas");
    expect(within(h).getByText(/sin cambios registrados/i)).toBeInTheDocument();
    expect(within(h).queryByRole("listitem")).toBeNull();
  });
  it("descarta eventos malformados o de etapas ajenas a la operación", async () => {
    serve([{ milestone_id: "m1" }, { milestone_id: "zz", from_status: "pending", to_status: "done", actor_user_id: U, occurred_at: "2026-10-20T10:00:00Z" }, "x", null]);
    await abrir();
    const h = await screen.findByTestId("historial-etapas");
    expect(within(h).queryByRole("listitem")).toBeNull();
  });
  it("fetchDetail: sin milestone_events devuelve lista vacía", async () => {
    serve();
    expect((await fetchDetail("o1"))?.events).toEqual([]);
  });
  it("muestra por etapa el cambio, quién y cuándo, en orden cronológico", async () => {
    serve([
      { milestone_id: "m1", from_status: "in_progress", to_status: "done", actor_user_id: U, occurred_at: "2026-10-21T15:30:00Z" },
      { milestone_id: "m1", from_status: "pending", to_status: "in_progress", actor_user_id: U, occurred_at: "2026-10-20T09:00:00Z" },
    ]);
    await abrir();
    const h = await screen.findByTestId("historial-etapas");
    const items = within(h).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(/Documentos.*pendiente.*en curso/);
    expect(items[1]).toHaveTextContent(/Documentos.*en curso.*hecha/);
    expect(items[1]).toHaveTextContent(U.slice(0, 8));
    expect(within(items[1]).getByText((_, el) => el?.tagName === "TIME" && el.getAttribute("datetime") === "2026-10-21T15:30:00Z")).toBeInTheDocument();
  });
});
