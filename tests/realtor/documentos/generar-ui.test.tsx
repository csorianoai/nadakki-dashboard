import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentosPanel } from "@/components/realtor/documentos/DocumentosPanel";
import { COPY } from "@/lib/realtor/documentos/copy";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const OP = "11111111-1111-4111-8111-111111111111";
const DOC = { id: "req-123", subject_type: "listing", doc_type: "listing_agreement", status: "active", title: "Acuerdo real" };
const OPERATION = { id: OP, kind: "rental", status: "in_progress" };

function backend(generateStatus: number) {
  mockApiFetch.mockImplementation(async (url: string, init?: { method?: string }) => {
    const u = String(url);
    if (u.includes("/documents/generate")) return { status: generateStatus, ok: generateStatus === 201 };
    if (u.includes("/operations")) return { status: 200, ok: true, json: async () => ({ items: [OPERATION], next_cursor: null }) };
    if (init?.method === "POST") return { status: 500 };
    return { status: 200, ok: true, json: async () => ({ items: [DOC], next_cursor: null }) };
  });
}
const generateCalls = () => mockApiFetch.mock.calls.filter(([u]) => String(u).includes("/documents/generate"));

beforeEach(() => {
  mockApiFetch.mockReset();
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
});

async function pickOperation() {
  const user = userEvent.setup();
  render(<DocumentosPanel />);
  const select = await screen.findByTestId("gen-operation");
  await waitFor(() => expect(screen.getAllByRole("option").length).toBeGreaterThan(1));
  await user.selectOptions(select, OP);
  return user;
}

describe("Generar borrador: negativos primero", () => {
  it.each([
    [403, "forbidden"],
    [404, "genNotFound"],
    [409, "genConflict"],
    [422, "genInvalid"],
    [502, "genStorage"],
    [500, "genError"],
  ] as const)("%s muestra su texto visible", async (status, key) => {
    backend(status);
    const user = await pickOperation();
    await user.click(screen.getByTestId("generate-doc"));
    expect(await screen.findByTestId("generate-error")).toHaveTextContent(COPY.es[key]);
    expect(screen.queryByTestId("generate-ok")).toBeNull();
  });

  it("sin operación elegida el botón está deshabilitado y no llama al backend", async () => {
    backend(201);
    render(<DocumentosPanel />);
    expect(await screen.findByTestId("generate-doc")).toBeDisabled();
    expect(generateCalls()).toHaveLength(0);
  });

  it("DEMO sigue bloqueado: el botón no se activa ni genera", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<DocumentosPanel />);
    expect(await screen.findByTestId("generate-doc")).toBeDisabled();
    expect(generateCalls()).toHaveLength(0);
  });
});

describe("Generar borrador: positivo", () => {
  it("201: llama con la operación y el tipo, sin tenant, y avisa", async () => {
    backend(201);
    const user = await pickOperation();
    await user.selectOptions(screen.getByTestId("gen-doctype"), "receipt");
    await user.click(screen.getByTestId("generate-doc"));
    expect(await screen.findByTestId("generate-ok")).toHaveTextContent(COPY.es.genOk);
    const [url, init] = generateCalls()[0];
    expect(url).toBe(`/api/v1/realestate/operations/${OP}/documents/generate?doc_type=receipt`);
    expect(init).toMatchObject({ method: "POST" });
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
  });
});
