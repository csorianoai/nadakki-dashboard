/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DocumentVersionsList } from "@/components/legal/cases/DocumentVersionsList";

const mockUseVersions = jest.fn();
jest.mock("@/hooks/legal/useDocumentVersions", () => ({
  useDocumentVersions: (...args: unknown[]) => mockUseVersions(...args),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const BASE_PROPS = { tenantId: "t1", caseId: "c1", documentId: "d1" };

const V1 = {
  version_id: "v1",
  document_id: "d1",
  version_number: 1,
  content_hash: "abc123def456ghi789",
  parent_version_id: null,
  created_at: "2026-05-08T12:00:00+00:00",
  created_by: "user-001",
  reason: "Generación inicial",
};

describe("DocumentVersionsList", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows loading state", () => {
    mockUseVersions.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    wrap(<DocumentVersionsList {...BASE_PROPS} />);
    expect(screen.getByText("Cargando versiones…")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseVersions.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    wrap(<DocumentVersionsList {...BASE_PROPS} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    mockUseVersions.mockReturnValue({
      data: { versions: [], count: 0, document_id: "d1" },
      isLoading: false,
      isError: false,
    });
    wrap(<DocumentVersionsList {...BASE_PROPS} />);
    expect(screen.getByTestId("no-versions")).toBeInTheDocument();
  });

  it("renders version list", () => {
    mockUseVersions.mockReturnValue({
      data: { versions: [V1], count: 1, document_id: "d1" },
      isLoading: false,
      isError: false,
    });
    wrap(<DocumentVersionsList {...BASE_PROPS} />);
    expect(screen.getByTestId("document-versions-list")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.getByText("Generación inicial")).toBeInTheDocument();
    expect(screen.getByText(/abc123def456/)).toBeInTheDocument();
  });

  it("renders multiple versions", () => {
    const v2 = { ...V1, version_id: "v2", version_number: 2, reason: "Revisión" };
    mockUseVersions.mockReturnValue({
      data: { versions: [v2, V1], count: 2, document_id: "d1" },
      isLoading: false,
      isError: false,
    });
    wrap(<DocumentVersionsList {...BASE_PROPS} />);
    expect(screen.getByText("Historial de versiones (2)")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
  });

  it("passes correct args to hook", () => {
    mockUseVersions.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    wrap(<DocumentVersionsList {...BASE_PROPS} />);
    expect(mockUseVersions).toHaveBeenCalledWith("t1", "c1", "d1");
  });
});
