/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrategyComparator } from "@/components/legal/strategies/StrategyComparator";

const MOCK_TENANT = "tenant-001";

const mockUseComparison = jest.fn();
jest.mock("@/hooks/legal/useStrategyComparison", () => ({
  useStrategyComparison: (...args: unknown[]) => mockUseComparison(...args),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const MOCK_COMPARISON = {
  case_id: "case-001",
  case_title: "Pérez v. García",
  case_type: "defensa_civil_cobro_pesos",
  state: "STRATEGY",
  strategies: [
    {
      strategy_id: "str-001",
      strategy_type: "defensive",
      title: "Excepción de prescripción",
      expected_strength: "0.85",
      expected_duration_days: 30,
      risks: ["Prueba insuficiente"],
      selected: true,
    },
    {
      strategy_id: "str-002",
      strategy_type: "offensive",
      title: "Reconvención",
      expected_strength: "0.45",
      expected_duration_days: 60,
      risks: [],
      selected: false,
    },
  ],
  strategy_count: 2,
  error: null,
};

const MOCK_COMPARISON_2 = {
  case_id: "case-002",
  case_title: "López v. Martínez",
  case_type: "recurso_apelacion_civil",
  state: "ACTIVE",
  strategies: [
    {
      strategy_id: "str-003",
      strategy_type: "defensive",
      title: "Nulidad procesal",
      expected_strength: "0.6",
      expected_duration_days: 45,
      risks: ["Plazo vencido"],
      selected: false,
    },
  ],
  strategy_count: 1,
  error: null,
};

describe("StrategyComparator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the comparator with input field", () => {
    mockUseComparison.mockReturnValue({
      comparisons: [],
      caseCount: 0,
      strategyTypes: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<StrategyComparator tenantId={MOCK_TENANT} />);
    expect(screen.getByTestId("strategy-comparator")).toBeInTheDocument();
    expect(screen.getByTestId("case-id-input")).toBeInTheDocument();
    expect(screen.getByTestId("min-cases-msg")).toBeInTheDocument();
  });

  it("shows loading state when fetching", () => {
    mockUseComparison.mockReturnValue({
      comparisons: [],
      caseCount: 0,
      strategyTypes: [],
      isLoading: true,
      isError: false,
      error: null,
    });
    wrap(<StrategyComparator tenantId={MOCK_TENANT} initialCaseIds={["a", "b"]} />);
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });

  it("shows error message on failure", () => {
    mockUseComparison.mockReturnValue({
      comparisons: [],
      caseCount: 0,
      strategyTypes: [],
      isLoading: false,
      isError: true,
      error: new Error("Server error"),
    });
    wrap(<StrategyComparator tenantId={MOCK_TENANT} initialCaseIds={["a", "b"]} />);
    expect(screen.getByTestId("error-msg")).toBeInTheDocument();
    expect(screen.getByText(/Server error/)).toBeInTheDocument();
  });

  it("renders comparison grid with strategies", () => {
    mockUseComparison.mockReturnValue({
      comparisons: [MOCK_COMPARISON, MOCK_COMPARISON_2],
      caseCount: 2,
      strategyTypes: ["defensive", "offensive"],
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<StrategyComparator tenantId={MOCK_TENANT} initialCaseIds={["case-001", "case-002"]} />);

    expect(screen.getByTestId("comparison-grid")).toBeInTheDocument();
    expect(screen.getByText("Pérez v. García")).toBeInTheDocument();
    expect(screen.getByText("López v. Martínez")).toBeInTheDocument();
    expect(screen.getByText("Excepción de prescripción")).toBeInTheDocument();
    expect(screen.getByText("Nulidad procesal")).toBeInTheDocument();
    expect(screen.getByText("Seleccionada")).toBeInTheDocument();
  });

  it("adds case id on button click", () => {
    mockUseComparison.mockReturnValue({
      comparisons: [],
      caseCount: 0,
      strategyTypes: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<StrategyComparator tenantId={MOCK_TENANT} />);

    const input = screen.getByTestId("case-id-input");
    const btn = screen.getByTestId("add-case-btn");

    fireEvent.change(input, { target: { value: "case-abc" } });
    fireEvent.click(btn);

    expect(screen.getByTestId("case-chips")).toBeInTheDocument();
    expect(screen.getByText("case-abc")).toBeInTheDocument();
  });

  it("removes case id chip on click", () => {
    mockUseComparison.mockReturnValue({
      comparisons: [],
      caseCount: 0,
      strategyTypes: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<StrategyComparator tenantId={MOCK_TENANT} initialCaseIds={["case-x", "case-y"]} />);

    expect(screen.getByText("case-x")).toBeInTheDocument();
    const removeBtn = screen.getByLabelText("Quitar case-x");
    fireEvent.click(removeBtn);
    expect(screen.queryByText("case-x")).not.toBeInTheDocument();
  });

  it("shows strength percentages with color coding", () => {
    mockUseComparison.mockReturnValue({
      comparisons: [MOCK_COMPARISON],
      caseCount: 1,
      strategyTypes: ["defensive", "offensive"],
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<StrategyComparator tenantId={MOCK_TENANT} initialCaseIds={["case-001", "case-002"]} />);

    expect(screen.getByText("Fuerza: 85%")).toBeInTheDocument();
    expect(screen.getByText("Fuerza: 45%")).toBeInTheDocument();
  });

  it("shows case error when case not found", () => {
    const errComp = {
      case_id: "case-missing",
      case_title: null,
      case_type: null,
      state: null,
      strategies: [],
      strategy_count: 0,
      error: "Case not found",
    };
    mockUseComparison.mockReturnValue({
      comparisons: [MOCK_COMPARISON, errComp],
      caseCount: 2,
      strategyTypes: ["defensive"],
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<StrategyComparator tenantId={MOCK_TENANT} initialCaseIds={["case-001", "case-missing"]} />);

    expect(screen.getByTestId("error-case-missing")).toBeInTheDocument();
    expect(screen.getByText("Case not found")).toBeInTheDocument();
  });

  it("passes correct params to hook", () => {
    mockUseComparison.mockReturnValue({
      comparisons: [],
      caseCount: 0,
      strategyTypes: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    wrap(<StrategyComparator tenantId={MOCK_TENANT} initialCaseIds={["a", "b"]} />);

    expect(mockUseComparison).toHaveBeenCalledWith(MOCK_TENANT, ["a", "b"]);
  });
});
