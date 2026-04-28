import { render, screen } from "@testing-library/react";
import BankCompliancePage from "@/app/(forge)/credit-hub/bank/compliance/page";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";

jest.mock("@/lib/credit-hub/hooks/useBankQueue", () => ({ useBankQueue: jest.fn() }));

describe("Bank compliance page", () => {
  test("shows compliance dashboard", () => {
    (useBankQueue as jest.Mock).mockReturnValue({ isLoading: false, data: { applications: [] } });
    render(<BankCompliancePage />);
    expect(screen.getByText("Ley 172-13 RD")).toBeInTheDocument();
    expect(screen.getByText(/Derecho al olvido/)).toBeInTheDocument();
  });
});
