/**
 * La pestana Documentos ya no muestra el aviso "persistencia de documentos no
 * garantizada (deuda S3) — no subir documentos reales": produccion guarda los
 * documentos legales en S3 (verificado 2026-11-20, subida 201 / descarga 200).
 */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, use: () => ({ id: "case-1" }) };
});
jest.mock("@/hooks/useLegalCasesMessages", () => ({
  useLegalCasesMessages: () => new Proxy({}, { get: () => "x" }),
}));
jest.mock("@/hooks/useLegalCore", () => ({
  useLegalEffectiveTenantId: () => ({ effectiveTenantId: "t-1", tenantHydrated: true, tenantError: null }),
}));
jest.mock("@/hooks/legal/useLegalCase", () => ({
  useLegalCase: () => ({
    data: { case_id: "case-1", title: "Caso", documents: [], deadlines: [], actors: [] },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));
jest.mock("@/hooks/legal/useCaseDocuments", () => ({
  useCaseDocuments: () => ({ uploadDocument: jest.fn(), uploading: false }),
}));
const Stub = () => <div data-testid="stub" />;
jest.mock("@/components/legal/cases/CaseDetailHeader", () => ({ CaseDetailHeader: Stub }));
jest.mock("@/components/legal/cases/CaseDocumentsList", () => ({ CaseDocumentsList: Stub }));
jest.mock("@/components/legal/cases/CaseDocumentUploader", () => ({ CaseDocumentUploader: Stub }));
jest.mock("@/components/legal/cases/CaseDocumentLifecycleSelector", () => ({ CaseDocumentLifecycleSelector: Stub }));
jest.mock("@/components/legal/cases/CaseDocumentExtractedDataReview", () => ({ CaseDocumentExtractedDataReview: Stub }));
jest.mock("@/components/legal/cases/DocumentGenerationButton", () => ({ DocumentGenerationButton: Stub }));
jest.mock("@/components/legal/cases/GeneratedDocumentsList", () => ({ GeneratedDocumentsList: Stub }));
jest.mock("@/components/legal/cases/GeneratedDocumentViewer", () => ({ GeneratedDocumentViewer: Stub }));

import Page from "@/app/(forge)/legal/cases/[id]/documents/page";

describe("Documentos del expediente", () => {
  it("no muestra el aviso obsoleto de persistencia S3", () => {
    render(<Page params={Promise.resolve({ id: "case-1" }) as never} />);
    expect(screen.queryByText(/persistencia de documentos no garantizada/i)).toBeNull();
    expect(screen.queryByText(/no subir documentos reales/i)).toBeNull();
    expect(screen.getAllByTestId("stub").length).toBeGreaterThan(0);
  });
});
