import { render, screen } from "@testing-library/react";
import { BankComplianceView } from "@/components/credit-hub/bank/BankComplianceView";

describe("BankComplianceView", () => {
  test("renders compliance profile heading", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <BankComplianceView issues={[]} regulator="CNBV" institutionName="TestBank" />
      </div>
    );
    expect(screen.getByRole("heading", { name: /Perfil CNBV — TestBank/i })).toBeInTheDocument();
  });
});
