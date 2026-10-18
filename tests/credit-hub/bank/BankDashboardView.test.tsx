import { screen } from "@testing-library/react";
import { BankDashboardView } from "@/components/credit-hub/bank/BankDashboardView";
import { getBankExperienceKpis } from "@/lib/credit-hub/api/bankExperienceClient";
import { renderWithQuery } from "../renderWithQuery";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useAuctionIntel", () => ({
  useAuctionIntel: () => ({ data: null, isError: true, isLoading: false }),
}));

jest.mock("@/lib/credit-hub/hooks/useRiskDistributions", () => ({
  useRiskDistributions: () => ({ data: null, isError: true, isLoading: false }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ tenantId: "tenant-test", apiTenantId: "tenant-test", tenantSlug: "tenant-test", loading: false }),
}));

jest.mock("@/lib/credit-hub/api/bankExperienceClient", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/bankExperienceClient"),
  getBankExperienceKpis: jest.fn(),
}));

const mockGetBankExperienceKpis = getBankExperienceKpis as jest.MockedFunction<typeof getBankExperienceKpis>;

describe("BankDashboardView", () => {
  beforeEach(() => {
    mockGetBankExperienceKpis.mockReset();
    mockGetBankExperienceKpis.mockResolvedValue({
      kpis: [{ key: "approval_rate", label: "Tasa de aprobación", value: 62, unit: "%" }],
    });
  });

  test("renders decision desk with institution name", async () => {
    renderWithQuery(
      <div className="credit-hub-forge" data-persona="bank">
        <BankDashboardView queue={[]} institutionName="TestBank Mexico" />
      </div>
    );
    expect(screen.getByRole("heading", { name: /Mesa de Decisión/i })).toBeInTheDocument();
    expect(screen.getByText(/Originación automotriz · Dealer → Banco/i)).toBeInTheDocument();
    expect(screen.getByTestId("bank-kpi-strip")).toBeInTheDocument();
    expect(screen.getByTestId("compliance-footer")).toBeInTheDocument();
    expect(await screen.findByTestId("bank-experience-kpis")).toBeInTheDocument();
    expect(screen.getByTestId("bank-kpi-approval_rate")).toHaveTextContent("62");
    expect(mockGetBankExperienceKpis).toHaveBeenCalledWith({ tenantId: "tenant-test" });
  });

  test("auction intel does not expose competitor lender names", async () => {
    renderWithQuery(
      <div className="credit-hub-forge" data-persona="bank">
        <BankDashboardView queue={[]} institutionName="TestBank Mexico" />
      </div>
    );
    expect(screen.getAllByText(/competidoras ocultas por diseño/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/winning_lender/i)).not.toBeInTheDocument();
    expect(await screen.findByTestId("bank-experience-kpis")).toBeInTheDocument();
  });
});
