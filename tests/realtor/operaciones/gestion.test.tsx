import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { OperacionGestion } from "@/components/realtor/operaciones/OperacionGestion";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const res = (status: number, body: unknown = {}) => ({ status, json: async () => body });
const P = "00000000-0000-4000-8000-000000005202";
const detail = (status = "pending") => res(200, { operation: { id: "o1", status: "in_progress" }, milestones: [{ id: "m1", label: "Documentos", position: 1, required: true, status }] });
const calls = (method: string) => mockApiFetch.mock.calls.filter(([, i]) => i?.method === method);

beforeEach(() => {
  mockApiFetch.mockReset();
  mockApiFetch.mockImplementation(async (path: string, init: { method?: string }) => {
    if (path.includes("/operation-templates")) return res(200, { items: [{ id: "t1", name: "Alquiler estándar", kind: "rental", is_active: true }], next_cursor: null });
    if (init.method === "POST" && path === "/api/v1/realestate/operations") return res(201, { id: "o1" });
    if (init.method === "GET") return detail();
    return res(200);
  });
});

describe("OperacionGestion", () => {
  it("abre la operación desde la propiedad y el contacto recibidos y muestra sus etapas", async () => {
    render(<OperacionGestion ops={[]} initialPropertyId={P} initialContactId="c1" />);
    await screen.findByRole("option", { name: "Alquiler estándar" });
    expect(screen.getByLabelText(/propiedad/i)).toHaveValue(P);
    await userEvent.click(screen.getByRole("button", { name: /abrir operación/i }));
    await screen.findByText("Documentos");
    const body = JSON.parse(calls("POST")[0][1].body);
    expect(body).toMatchObject({ kind: "rental", property_id: P, template_id: "t1", parties: [{ contact_id: "c1", role: "tenant" }] });
  });
  it("sin propiedad no llama a la API y avisa", async () => {
    render(<OperacionGestion ops={[]} />);
    await screen.findByRole("option", { name: "Alquiler estándar" });
    await userEvent.click(screen.getByRole("button", { name: /abrir operación/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(calls("POST")).toHaveLength(0);
  });
  it("avanza una etapa y recarga", async () => {
    render(<OperacionGestion ops={[{ id: "o1", code: "Alquiler o1", kind: "alquiler", stage: null, summary: { es: "x", en: "x" } }]} />);
    await userEvent.click(await screen.findByRole("button", { name: /gestionar/i }));
    await userEvent.click(await screen.findByRole("button", { name: /marcar hecha/i }));
    await waitFor(() => expect(calls("PATCH")).toHaveLength(1));
    expect(JSON.parse(calls("PATCH")[0][1].body)).toEqual({ status: "done" });
  });
  it("sube un documento y envía a revisión; un 409 se explica", async () => {
    render(<OperacionGestion ops={[{ id: "o1", code: "Alquiler o1", kind: "alquiler", stage: null, summary: { es: "x", en: "x" } }]} />);
    await userEvent.click(await screen.findByRole("button", { name: /gestionar/i }));
    await userEvent.upload(await screen.findByLabelText(/archivo/i), new File(["x"], "c.pdf", { type: "application/pdf" }));
    await userEvent.click(screen.getByRole("button", { name: /subir documento/i }));
    await waitFor(() => expect(mockApiFetch.mock.calls.some(([p]) => String(p).includes("/documents?"))).toBe(true));
    mockApiFetch.mockImplementation(async (_p: string, init: { method?: string }) => (init.method === "POST" ? res(409) : detail()));
    await userEvent.click(screen.getByRole("button", { name: /enviar a revisión/i }));
    expect(await screen.findByText(/ya hay una revisión pendiente/i)).toBeInTheDocument();
  });
});
