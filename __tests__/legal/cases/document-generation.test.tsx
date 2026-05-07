/** @jest-environment jsdom */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import {
  postGenerateDocument,
  fetchGeneratedDocuments,
  fetchGeneratedDocument,
} from "@/lib/legal/cases/legal-cases-api";
import { useGenerateDocument } from "@/hooks/legal/useDocumentGeneration";
import { DocumentGenerationDialog } from "@/components/legal/cases/DocumentGenerationDialog";
import { GeneratedDocumentsList } from "@/components/legal/cases/GeneratedDocumentsList";

jest.mock("@/hooks/legal/useDocumentGeneration", () => {
  const actual = jest.requireActual("@/hooks/legal/useDocumentGeneration");
  return {
    ...actual,
    useGeneratedDocuments: jest.fn(),
  };
});

import { useGeneratedDocuments } from "@/hooks/legal/useDocumentGeneration";

const useGeneratedDocumentsMock = useGeneratedDocuments as jest.MockedFunction<
  typeof useGeneratedDocuments
>;

function queryWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("legal-cases-api — generación de documentos (fetch)", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("postGenerateDocument llama POST /api/legal/cases/{id}/documents/generate con X-Tenant-ID", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ document_id: "doc-1", attorney_validated: false }),
    });
    await postGenerateDocument("tenant-a", "case-1", {
      document_type: "denuncia_penal",
      parameters: { k: 1 },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/legal/cases/case-1/documents/generate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Tenant-ID": "tenant-a",
          "Content-Type": "application/json",
        }),
      })
    );
    const opts = (global.fetch as jest.Mock).mock.calls[0][1] as { body: string };
    expect(JSON.parse(opts.body)).toEqual({
      document_type: "denuncia_penal",
      parameters: { k: 1 },
    });
  });

  it("fetchGeneratedDocuments llama GET .../documents/generated", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ documents: [], count: 0 }),
    });
    await fetchGeneratedDocuments("t1", "c1");
    expect(global.fetch).toHaveBeenCalledWith("/api/legal/cases/c1/documents/generated", {
      headers: expect.objectContaining({ "X-Tenant-ID": "t1" }),
    });
  });

  it("fetchGeneratedDocument llama GET .../generated/{id}", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          document_id: "d1",
          document_type: "querella_penal",
          content: "x",
          attorney_validated: false,
        }),
    });
    await fetchGeneratedDocument("t1", "c1", "d1");
    expect(global.fetch).toHaveBeenCalledWith("/api/legal/cases/c1/documents/generated/d1", {
      headers: expect.objectContaining({ "X-Tenant-ID": "t1" }),
    });
  });
});

describe("useGenerateDocument", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ document_id: "n1", attorney_validated: false }),
    });
  });

  it("ejecuta la mutación llamando al endpoint de generación", async () => {
    const { result } = renderHook(() => useGenerateDocument("t1", "c1"), {
      wrapper: queryWrapper(),
    });
    await result.current.mutateAsync({
      document_type: "querella_penal",
      parameters: { instrucciones: "texto" },
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/legal/cases/c1/documents/generate",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("DocumentGenerationDialog", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ document_id: "x", attorney_validated: false }),
    });
  });

  it("renderiza el formulario de generación", () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
        <DocumentGenerationDialog tenantId="t1" caseId="c1" open onClose={() => {}} />
      </QueryClientProvider>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de documento/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generar$/i })).toBeInTheDocument();
  });

  it("valida instrucciones vacías antes de enviar", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
        <DocumentGenerationDialog tenantId="t1" caseId="c1" open onClose={() => {}} />
      </QueryClientProvider>
    );
    await user.click(screen.getByRole("button", { name: /^Generar$/i }));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("GeneratedDocumentsList", () => {
  beforeEach(() => {
    useGeneratedDocumentsMock.mockReset();
  });

  it("muestra estado vacío y CTA", () => {
    useGeneratedDocumentsMock.mockReturnValue({
      data: { documents: [], count: 0 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useGeneratedDocuments>);

    const onGen = jest.fn();
    render(
      <GeneratedDocumentsList
        tenantId="t1"
        caseId="c1"
        onViewDocument={() => {}}
        showCtaWhenEmpty
        onCtaGenerate={onGen}
      />
    );
    expect(screen.getByText(/Aún no hay documentos generados/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generar el primer documento/i })).toBeInTheDocument();
  });

  it("lista documentos cuando hay datos", () => {
    useGeneratedDocumentsMock.mockReturnValue({
      data: {
        documents: [
          {
            document_id: "d-1",
            document_type: "denuncia_penal",
            generated_at: "2026-03-01T12:00:00.000Z",
            attorney_validated: false,
          },
        ],
        count: 1,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useGeneratedDocuments>);

    render(<GeneratedDocumentsList tenantId="t1" caseId="c1" onViewDocument={() => {}} />);
    expect(screen.getByText(/Denuncia penal/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ver documento/i })).toBeInTheDocument();
  });
});
