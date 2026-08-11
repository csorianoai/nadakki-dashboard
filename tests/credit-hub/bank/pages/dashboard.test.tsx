import { render, screen } from "@testing-library/react";
import BankDashboardPage from "@/app/(forge)/credit-hub/bank/page";
import { useBankAnalytics } from "@/lib/credit-hub/hooks/useBankAnalytics";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useBankAnalytics", () => ({ useBankAnalytics: jest.fn() }));
jest.mock("@/lib/credit-hub/hooks/useBankQueue", () => ({ useBankQueue: jest.fn() }));
jest.mock("@/lib/credit-hub/hooks/useAuctionIntel", () => ({
  useAuctionIntel: () => ({ data: null, isError: true, isLoading: false }),
}));
jest.mock("@/lib/credit-hub/hooks/useRiskDistributions", () => ({
  useRiskDistributions: () => ({ data: null, isError: true, isLoading: false }),
}));
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({ tenantConfig: { institution_name: "Test Bank" }, loading: false }),
}));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ apiTenantId: "tenant-test", tenantId: "tenant-test", tenantSlug: "tenant-test", loading: false }),
}));
jest.mock("@/lib/credit-hub/hooks/useMonthlyGoals", () => ({
  useMonthlyGoals: () => ({ data: { goals: [] }, isError: false, isFetched: true, isFetching: false, fetchStatus: "idle", refetch: jest.fn() }),
}));
jest.mock("@/components/credit-hub/onboarding/WelcomeGuide", () => ({
  WelcomeGuide: () => null,
}));
jest.mock("@/lib/credit-hub/hooks/useBulkActions", () => ({
  useBulkActions: () => ({ mutateAsync: jest.fn(), isPending: false, data: null }),
}));
jest.mock("@/components/credit-hub/bank/sections/BankExperienceKpisPanel", () => ({
  BankExperienceKpisPanel: () => null,
}));
jest.mock("@/components/credit-hub/bank/sections/BankGoals", () => ({
  BankGoals: () => null,
}));

describe("Bank dashboard page", () => {
  test("renders executive dashboard and queue", () => {
    (useBankAnalytics as jest.Mock).mockReturnValue({
      data: { applications_by_status: {}, approval_rate: 0, portfolio_value: 0, total_applications: 0 },
      isLoading: false,
      isFetched: true,
      isFetching: false,
      fetchStatus: "idle",
      error: null,
    });
    (useBankQueue as jest.Mock).mockReturnValue({
      data: { applications: [] },
      isLoading: false,
      isFetched: true,
      isFetching: false,
      fetchStatus: "idle",
      error: null,
    });
    render(<BankDashboardPage />);
    expect(screen.getByRole("heading", { name: /Mesa de Decisión/i })).toBeInTheDocument();
    expect(screen.getByTestId("bank-kpi-strip")).toBeInTheDocument();
  });

  test("estipulaciones card is ROADMAP when queue is empty (no invented count)", () => {
    (useBankAnalytics as jest.Mock).mockReturnValue({
      data: { applications_by_status: {}, approval_rate: 0, portfolio_value: 0, total_applications: 0 },
      isFetched: true,
      isFetching: false,
      fetchStatus: "idle",
      error: null,
    });
    (useBankQueue as jest.Mock).mockReturnValue({
      data: { applications: [] },
      isFetched: true,
      isFetching: false,
      fetchStatus: "idle",
      error: null,
    });
    render(<BankDashboardPage />);
    expect(screen.getByText(/Estipulaciones por revisar/i)).toBeInTheDocument();
    expect(screen.queryByText(/^2$/)).not.toBeInTheDocument();
  });
});
