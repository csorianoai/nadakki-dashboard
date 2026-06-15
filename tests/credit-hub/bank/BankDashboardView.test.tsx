import { render, screen } from "@testing-library/react";
import { BankDashboardView } from "@/components/credit-hub/bank/BankDashboardView";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("BankDashboardView", () => {
  test("renders hero with institution name", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <BankDashboardView queue={[]} institutionName="TestBank Mexico" />
      </div>
    );
    expect(screen.getByRole("heading", { name: /Mesa de decisiones — TestBank Mexico/i })).toBeInTheDocument();
  });
});
