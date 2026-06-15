import { render, screen } from "@testing-library/react";
import { BankAuditView } from "@/components/credit-hub/bank/BankAuditView";

describe("BankAuditView", () => {
  test("renders audit viewer title", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <BankAuditView events={[]} />
      </div>
    );
    expect(screen.getByRole("heading", { name: /Visor de auditoría/i })).toBeInTheDocument();
  });
});
