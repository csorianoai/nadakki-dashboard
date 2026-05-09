/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JurisdictionSelector } from "@/components/legal/JurisdictionSelector";
import { JurisdictionStatusBadge } from "@/components/legal/JurisdictionStatusBadge";

const MOCK_TENANT = "tenant-001";

const mockUseJurisdictions = jest.fn();
jest.mock("@/hooks/legal/useJurisdictions", () => ({
  useJurisdictions: (...args: unknown[]) => mockUseJurisdictions(...args),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const MOCK_JURISDICTIONS = [
  {
    code: "do",
    name: "República Dominicana",
    status: "production",
    version: "2.0.0",
    description: "Knowledge pack DO",
  },
  {
    code: "co",
    name: "Colombia",
    status: "skeleton",
    version: "0.1.0",
    description: "Knowledge pack CO",
  },
];

describe("JurisdictionSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    mockUseJurisdictions.mockReturnValue({
      jurisdictions: [],
      isLoading: true,
      isError: false,
      error: null,
    });
    wrap(<JurisdictionSelector tenantId={MOCK_TENANT} />);
    expect(screen.getByTestId("jurisdiction-loading")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockUseJurisdictions.mockReturnValue({
      jurisdictions: [],
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
    });
    wrap(<JurisdictionSelector tenantId={MOCK_TENANT} />);
    expect(screen.getByTestId("jurisdiction-error")).toBeInTheDocument();
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it("renders empty state", () => {
    mockUseJurisdictions.mockReturnValue({
      jurisdictions: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<JurisdictionSelector tenantId={MOCK_TENANT} />);
    expect(screen.getByTestId("jurisdiction-empty")).toBeInTheDocument();
  });

  it("renders jurisdiction options", () => {
    mockUseJurisdictions.mockReturnValue({
      jurisdictions: MOCK_JURISDICTIONS,
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<JurisdictionSelector tenantId={MOCK_TENANT} />);

    expect(screen.getByTestId("jurisdiction-selector")).toBeInTheDocument();
    expect(screen.getByTestId("jurisdiction-option-do")).toBeInTheDocument();
    expect(screen.getByTestId("jurisdiction-option-co")).toBeInTheDocument();
    expect(screen.getByText("República Dominicana")).toBeInTheDocument();
    expect(screen.getByText("Colombia")).toBeInTheDocument();
  });

  it("calls onChange on click", () => {
    mockUseJurisdictions.mockReturnValue({
      jurisdictions: MOCK_JURISDICTIONS,
      isLoading: false,
      isError: false,
      error: null,
    });
    const onChange = jest.fn();
    wrap(<JurisdictionSelector tenantId={MOCK_TENANT} onChange={onChange} />);

    fireEvent.click(screen.getByTestId("jurisdiction-option-co"));
    expect(onChange).toHaveBeenCalledWith("co");
  });

  it("highlights selected jurisdiction", () => {
    mockUseJurisdictions.mockReturnValue({
      jurisdictions: MOCK_JURISDICTIONS,
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<JurisdictionSelector tenantId={MOCK_TENANT} value="do" />);

    const doBtn = screen.getByTestId("jurisdiction-option-do");
    expect(doBtn.className).toContain("border-blue-500");
  });

  it("shows version and description", () => {
    mockUseJurisdictions.mockReturnValue({
      jurisdictions: MOCK_JURISDICTIONS,
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<JurisdictionSelector tenantId={MOCK_TENANT} />);

    expect(screen.getByText(/v2\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText(/v0\.1\.0/)).toBeInTheDocument();
  });

  it("passes tenantId to hook", () => {
    mockUseJurisdictions.mockReturnValue({
      jurisdictions: [],
      isLoading: true,
      isError: false,
      error: null,
    });
    wrap(<JurisdictionSelector tenantId={MOCK_TENANT} />);
    expect(mockUseJurisdictions).toHaveBeenCalledWith(MOCK_TENANT);
  });
});

describe("JurisdictionStatusBadge", () => {
  it("renders production badge", () => {
    render(<JurisdictionStatusBadge status="production" />);
    expect(screen.getByTestId("jurisdiction-status-badge")).toBeInTheDocument();
    expect(screen.getByText("Producción")).toBeInTheDocument();
  });

  it("renders skeleton badge", () => {
    render(<JurisdictionStatusBadge status="skeleton" />);
    expect(screen.getByText("Esqueleto")).toBeInTheDocument();
  });

  it("renders unknown status gracefully", () => {
    render(<JurisdictionStatusBadge status="xyz" />);
    expect(screen.getByText("Desconocido")).toBeInTheDocument();
  });
});
