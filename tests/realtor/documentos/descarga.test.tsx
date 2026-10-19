import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentosPanel } from "@/components/realtor/documentos/DocumentosPanel";
import { COPY } from "@/lib/realtor/documentos/copy";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a), getAuthHeaders: () => ({}) }));

const DOC = { id: "req-123", subject_type: "listing", doc_type: "listing_agreement", status: "active", title: "Acuerdo real" };
const DL = "/api/v1/realestate/documents/req-123/download";

function backend(downloadStatus: number) {
  mockApiFetch.mockImplementation(async (url: string) => {
    if (String(url).includes("/download")) {
      return { status: downloadStatus, ok: downloadStatus === 200, blob: async () => new Blob(["x"]) };
    }
    return { status: 200, ok: true, json: async () => ({ items: [DOC], next_cursor: null }) };
  });
}
const downloadCalls = () => mockApiFetch.mock.calls.filter(([u]) => String(u).includes("/download"));

beforeEach(() => {
  mockApiFetch.mockReset();
  delete process.env.NEXT_PUBLIC_REALTOR_PANEL;
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  (URL as unknown as { createObjectURL: () => string }).createObjectURL = () => "blob:x";
  (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => undefined;
});

describe("descarga de documentos", () => {
  it("(a) llama a la ruta con el id correcto y sin cabeceras ajenas al JWT", async () => {
    backend(200);
    render(<DocumentosPanel />);
    await userEvent.click(await screen.findByTestId("doc-download"));
    await waitFor(() => expect(downloadCalls()).toHaveLength(1));
    const [url, init] = downloadCalls()[0];
    expect(url).toBe(DL);
    expect(init?.method ?? "GET").toBe("GET");
    expect(init?.headers ?? {}).toEqual({});
  });

  it("(b) 410 muestra el copy de retirado", async () => {
    backend(410);
    render(<DocumentosPanel />);
    await userEvent.click(await screen.findByTestId("doc-download"));
    expect(await screen.findByTestId("doc-download-error")).toHaveTextContent(COPY.es.dlGone);
  });

  it("404 muestra el copy de no encontrado", async () => {
    backend(404);
    render(<DocumentosPanel />);
    await userEvent.click(await screen.findByTestId("doc-download"));
    expect(await screen.findByTestId("doc-download-error")).toHaveTextContent(COPY.es.dlNotFound);
  });

  it("error genérico ofrece reintento", async () => {
    backend(503);
    render(<DocumentosPanel />);
    await userEvent.click(await screen.findByTestId("doc-download"));
    expect(await screen.findByTestId("doc-download-error")).toHaveTextContent(COPY.es.dlError);
    backend(200);
    await userEvent.click(screen.getByTestId("doc-download-retry"));
    await waitFor(() => expect(screen.queryByTestId("doc-download-error")).toBeNull());
  });

  it("(c) en DEMO el botón está deshabilitado y no llama al backend de descarga", async () => {
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<DocumentosPanel />);
    const btns = await screen.findAllByTestId("doc-download");
    btns.forEach((b) => {
      expect(b).toBeDisabled();
      expect(b).toHaveTextContent(COPY.es.dlDemo);
    });
    await userEvent.click(btns[0]);
    expect(downloadCalls()).toHaveLength(0);
  });

  it("(d) ningún fuente del módulo contiene host del almacén", () => {
    const dirs = [join(process.cwd(), "lib/realtor/documentos"), join(process.cwd(), "components/realtor/documentos")];
    for (const d of dirs) {
      for (const f of readdirSync(d)) {
        const src = readFileSync(join(d, f), "utf8");
        expect(src).not.toMatch(/https?:\/\//i);
        expect(src).not.toMatch(/amazonaws|blob\.core|storage\.googleapis|r2\.cloudflarestorage|supabase\.co/i);
      }
    }
  });
});
