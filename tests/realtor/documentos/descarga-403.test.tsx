import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentosPanel } from "@/components/realtor/documentos/DocumentosPanel";
import { COPY } from "@/lib/realtor/documentos/copy";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const DOC = { id: "req-123", subject_type: "listing", doc_type: "listing_agreement", status: "active", title: "Acuerdo real" };

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  mockApiFetch.mockImplementation(async (url: string) => {
    if (String(url).includes("/download")) return { status: 403, ok: false };
    return { status: 200, ok: true, json: async () => ({ items: [DOC], next_cursor: null }) };
  });
});

describe("descarga 403 visible", () => {
  it("muestra el texto de permiso denegado, sin reintento", async () => {
    render(<DocumentosPanel />);
    await userEvent.click(await screen.findByTestId("doc-download"));
    expect(await screen.findByTestId("doc-download-error")).toHaveTextContent(COPY.es.forbidden);
    expect(screen.queryByTestId("doc-download-retry")).toBeNull();
  });
});
