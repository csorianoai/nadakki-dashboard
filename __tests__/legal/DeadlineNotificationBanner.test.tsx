/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DeadlineNotificationBanner } from "@/components/legal/DeadlineNotificationBanner";

const MOCK_TENANT = "tenant-001";

jest.mock("@/hooks/useLegalCore", () => ({
  useLegalEffectiveTenantId: () => ({
    effectiveTenantId: MOCK_TENANT,
    tenantHydrated: true,
    tenantError: null,
  }),
}));

const mockUseUpcoming = jest.fn();
jest.mock("@/hooks/legal/useUpcomingDeadlines", () => ({
  useUpcomingDeadlines: (...args: unknown[]) => mockUseUpcoming(...args),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const DL_BASE = {
  deadline_id: "dl-001",
  case_id: "c-001",
  case_title: "Pérez v. García",
  case_number_internal: "EXP-001",
  deadline_db_id: "CIVIL-APELACION-001",
  deadline_category: "procesal",
  deadline_sub_category: "apelacion",
  trigger_event: "case_created",
  auto_calculated_deadline_date: "2026-06-01",
  legal_basis: "Ley 834 Art. 5",
  is_peremptory: true,
  status: "active",
  acknowledged_at: null,
  acknowledged_by: null,
};

describe("DeadlineNotificationBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when loading", () => {
    mockUseUpcoming.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = wrap(<DeadlineNotificationBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when no deadlines", () => {
    mockUseUpcoming.mockReturnValue({
      data: { deadlines: [], count: 0, horizon_days: 7 },
      isLoading: false,
    });
    const { container } = wrap(<DeadlineNotificationBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("renders banner with single deadline", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dl = {
      ...DL_BASE,
      effective_deadline_date: tomorrow.toISOString().slice(0, 10),
    };
    mockUseUpcoming.mockReturnValue({
      data: { deadlines: [dl], count: 1, horizon_days: 7 },
      isLoading: false,
    });
    wrap(<DeadlineNotificationBanner />);
    expect(screen.getByTestId("deadline-notification-banner")).toBeInTheDocument();
    expect(screen.getByText("1 plazo próximo a vencer")).toBeInTheDocument();
    expect(screen.getByText(/Pérez v\. García/)).toBeInTheDocument();
  });

  it("renders banner with multiple deadlines", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    const dl1 = { ...DL_BASE, effective_deadline_date: dateStr };
    const dl2 = {
      ...DL_BASE,
      deadline_id: "dl-002",
      case_title: "Caso B",
      effective_deadline_date: dateStr,
    };
    mockUseUpcoming.mockReturnValue({
      data: { deadlines: [dl1, dl2], count: 2, horizon_days: 7 },
      isLoading: false,
    });
    wrap(<DeadlineNotificationBanner />);
    expect(screen.getByText("2 plazos próximos a vencer")).toBeInTheDocument();
  });

  it("shows peremptory label", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dl = {
      ...DL_BASE,
      effective_deadline_date: tomorrow.toISOString().slice(0, 10),
      is_peremptory: true,
    };
    mockUseUpcoming.mockReturnValue({
      data: { deadlines: [dl], count: 1, horizon_days: 7 },
      isLoading: false,
    });
    wrap(<DeadlineNotificationBanner />);
    expect(screen.getByText(/perentorio/)).toBeInTheDocument();
  });

  it("passes correct params to hook", () => {
    mockUseUpcoming.mockReturnValue({ data: undefined, isLoading: true });
    wrap(<DeadlineNotificationBanner />);
    expect(mockUseUpcoming).toHaveBeenCalledWith(MOCK_TENANT, 7);
  });
});
