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
jest.mock("@/components/credit-hub/onboarding/WelcomeGuide", () => ({
  WelcomeGuide: () => null,
}));
jest.mock("@/lib/credit-hub/hooks/useBulkActions", () => ({
  useBulkActions: () => ({ mutateAsync: jest.fn(), isPending: false, data: null }),
}));

describe("Bank dashboard page", () => {
  test("renders executive dashboard and queue", () => {
    (useBankAnalytics as jest.Mock).mockReturnValue({
      data: { applications_by_status: {}, approval_rate: 0, portfolio_value: 0, total_applications: 0 },
      isLoading: false,
      error: null,
    });
    (useBankQueue as jest.Mock).mockReturnValue({ data: { applications: [] }, isLoading: false, error: null });
    render(<BankDashboardPage />);
    expect(screen.getByRole("heading", { name: /Mesa de Decisión/i })).toBeInTheDocument();
    expect(screen.getByTestId("bank-kpi-strip")).toBeInTheDocument();
  });
});
