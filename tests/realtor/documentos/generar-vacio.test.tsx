import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentosPanel } from "@/components/realtor/documentos/DocumentosPanel";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const OP = "11111111-1111-4111-8111-111111111111";
const DOC = { id: "req-1", subject_type: "listing", doc_type: "listing_agreement", status: "active", title: "Primero" };
let generated = false;

beforeEach(() => {
  generated = false;
  mockApiFetch.mockReset();
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  mockApiFetch.mockImplementation(async (url: string) => {
    const u = String(url);
    if (u.includes("/documents/generate")) { generated = true; return { status: 201, ok: true }; }
    if (u.includes("/operations")) return { status: 200, ok: true, json: async () => ({ items: [{ id: OP, kind: "rental", status: "in_progress" }], next_cursor: null }) };
    return { status: 200, ok: true, json: async () => ({ items: generated ? [DOC] : [], next_cursor: null }) };
  });
});

describe("Generar borrador con la lista vacía (modo real)", () => {
  it("el botón es visible sin documentos y, tras elegir operación y 201, se recarga la lista", async () => {
    const user = userEvent.setup();
    render(<DocumentosPanel />);
    await screen.findByTestId("documentos-empty");
    const select = await screen.findByTestId("gen-operation");
    expect(screen.getByTestId("generate-doc")).toBeDisabled();
    await waitFor(() => expect(screen.getAllByRole("option").length).toBeGreaterThan(1));
    await user.selectOptions(select, OP);
    await user.click(screen.getByTestId("generate-doc"));
    await waitFor(() => expect(screen.getAllByTestId("doc-row")).toHaveLength(1));
    expect(screen.queryByTestId("documentos-empty")).toBeNull();
  });
});
