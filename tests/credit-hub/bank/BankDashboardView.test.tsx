import { render, screen } from "@testing-library/react";
import { BankDashboardView } from "@/components/credit-hub/bank/BankDashboardView";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useAuctionIntel", () => ({
  useAuctionIntel: () => ({ data: null, isError: true, isLoading: false }),
}));

jest.mock("@/lib/credit-hub/hooks/useRiskDistributions", () => ({
  useRiskDistributions: () => ({ data: null, isError: true, isLoading: false }),
}));

describe("BankDashboardView", () => {
  test("renders decision desk with institution name", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <BankDashboardView queue={[]} institutionName="TestBank Mexico" />
      </div>
    );
    expect(screen.getByRole("heading", { name: /Cockpit del Banco/i })).toBeInTheDocument();
    expect(screen.getByText(/Revisión humana requerida/i)).toBeInTheDocument();
    expect(screen.getByTestId("bank-kpi-strip")).toBeInTheDocument();
    expect(screen.getByTestId("compliance-footer")).toBeInTheDocument();
  });

  test("auction intel does not expose competitor lender names", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <BankDashboardView queue={[]} institutionName="TestBank Mexico" />
      </div>
    );
    expect(screen.getAllByText(/competidoras ocultas por diseño/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/winning_lender/i)).not.toBeInTheDocument();
  });
});
