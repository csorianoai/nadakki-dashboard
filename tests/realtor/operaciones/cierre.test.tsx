import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { OperacionGestion } from "@/components/realtor/operaciones/OperacionGestion";
import { closeOperation } from "@/components/realtor/operaciones/escritura";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const res = (status: number, body: unknown = {}) => ({ status, json: async () => body });
const ms = [{ id: "m1", label: "Documentos", position: 1, required: true, status: "done" }];
const OPS = [{ id: "o1", code: "Alquiler o1", kind: "alquiler", stage: null, summary: { es: "x", en: "x" } }] as const;
let estado = "in_progress";
const serve = (closeStatus: number) =>
  mockApiFetch.mockImplementation(async (path: string, init: { method?: string }) => {
    if (path.includes("/operation-templates")) return res(200, { items: [], next_cursor: null });
    if (init.method === "GET") return res(200, { operation: { id: "o1", status: estado }, milestones: ms });
    if (path.endsWith("/close")) {
      if (closeStatus === 200) estado = "closed_won";
      return res(closeStatus, closeStatus === 200 ? { operation: { id: "o1", status: "closed_won" } } : {});
    }
    return res(200);
  });
const abrir = async () => { render(<OperacionGestion ops={[...OPS]} />); await userEvent.click(await screen.findByRole("button", { name: /gestionar/i })); };
const cerrar = async () => userEvent.click(await screen.findByRole("button", { name: /cerrar operación/i }));
const closeCalls = () => mockApiFetch.mock.calls.filter((c) => String(c[0]).endsWith("/close"));

beforeEach(() => { mockApiFetch.mockReset(); estado = "in_progress"; });

describe("cerrar operación (G7)", () => {
  it("403: avisa que no tiene permiso y no da por cerrada la operación", async () => {
    serve(403);
    await abrir(); await cerrar();
    expect(await screen.findByRole("alert")).toHaveTextContent(/no tienes permiso/i);
    expect(screen.queryByText(/operación cerrada/i)).toBeNull();
  });
  it("404: avisa que la operación no existe", async () => {
    serve(404);
    await abrir(); await cerrar();
    expect(await screen.findByRole("alert")).toHaveTextContent(/no existe/i);
  });
  it("409: explica que hay etapas abiertas o revisión pendiente", async () => {
    serve(409);
    await abrir(); await cerrar();
    expect(await screen.findByRole("alert")).toHaveTextContent(/etapas obligatorias|revisión/i);
  });
  it("422: pide revisar los datos", async () => {
    serve(422);
    await abrir(); await cerrar();
    expect(await screen.findByRole("alert")).toHaveTextContent(/datos inválidos/i);
  });
  it("closeOperation: fallo de red → status 0; nunca envía tenant", async () => {
    mockApiFetch.mockRejectedValue(new Error("net"));
    expect(await closeOperation("o1", "cancelled", "x")).toEqual({ ok: false, status: 0 });
  });
  it("una operación ya cerrada no ofrece cerrar", async () => {
    estado = "closed_won"; serve(200);
    await abrir();
    expect(await screen.findByTestId("operacion-detalle")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cerrar operación/i })).toBeNull();
  });
  it("positivo: POST /close con outcome y motivo, sin tenant; recarga y deja de ofrecer cerrar", async () => {
    serve(200);
    await abrir();
    await userEvent.selectOptions(await screen.findByLabelText(/resultado del cierre/i), "cancelled");
    await userEvent.type(screen.getByLabelText(/motivo/i), "cliente desiste");
    await cerrar();
    expect(await screen.findByRole("status")).toHaveTextContent(/operación cerrada/i);
    const [path, init] = closeCalls()[0];
    expect(path).toBe("/api/v1/realestate/operations/o1/close");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ outcome: "cancelled", reason: "cliente desiste" });
    expect(screen.queryByRole("button", { name: /cerrar operación/i })).toBeNull();
  });
});
