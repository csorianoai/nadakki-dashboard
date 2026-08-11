import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BankApplicationsQueuePage from "@/app/(forge)/credit-hub/bank/applications/page";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => "/credit-hub/bank/applications",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/credit-hub/hooks/useBankQueue", () => ({ useBankQueue: jest.fn() }));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ apiTenantId: "tenant-test", tenantId: "tenant-test", tenantSlug: "tenant-test", loading: false }),
}));
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "analyst-1" } }),
}));
jest.mock("@/lib/credit-hub/hooks/useBulkActions", () => ({
  useBulkActions: () => ({ mutateAsync: jest.fn(), isPending: false, data: null }),
}));

const row = (id: string, name: string, score: number) => ({
  application_id: id,
  tenant_id: "t",
  state: "DRAFT",
  applicant_name: name,
  dealer_id: null,
  dealer_name: "Dealer A",
  vehicle_label: "Toyota",
  requested_amount: 1,
  score,
  risk_level: "BAJO",
  approval_band: "PREAPROBABLE",
  priority: "ALTA" as const,
  created_at: null,
  bank_decision: null,
});

describe("Bank queue page", () => {
  test("shows applications ordered by provided score order", () => {
    (useBankQueue as jest.Mock).mockReturnValue({
      isLoading: false,
      isFetching: false,
      isFetched: true,
      fetchStatus: "idle",
      error: null,
      refetch: jest.fn(),
      data: { applications: [row("high", "Alta", 900), row("low", "Baja", 620)], total: 2, total_count: 2 },
    });
    render(<BankApplicationsQueuePage />);
    expect(screen.getAllByText("Alta").length).toBeGreaterThan(0);
    expect(screen.getAllByText("900").length).toBeGreaterThan(0);
    expect(screen.getByText(/mostrando 2 de 2/i)).toBeInTheDocument();
  });

  test("error state offers retry", async () => {
    const refetch = jest.fn();
    (useBankQueue as jest.Mock).mockReturnValue({
      isLoading: false,
      isFetching: false,
      isFetched: true,
      isError: true,
      fetchStatus: "idle",
      error: new Error("network"),
      refetch,
      data: undefined,
    });
    render(<BankApplicationsQueuePage />);
    await userEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(refetch).toHaveBeenCalled();
  });

  test("empty state when queue has zero applications", () => {
    (useBankQueue as jest.Mock).mockReturnValue({
      isLoading: false,
      isFetching: false,
      isFetched: true,
      fetchStatus: "idle",
      error: null,
      refetch: jest.fn(),
      data: { applications: [], total: 0, total_count: 0 },
    });
    render(<BankApplicationsQueuePage />);
    expect(screen.getByText(/sin solicitudes en la bandeja/i)).toBeInTheDocument();
  });
});
