import { render, screen } from "@testing-library/react";
import BankApplicationReviewPage from "@/app/(forge)/credit-hub/bank/applications/[applicationId]/page";
import { useBankApplication, useBankAuditTrail, useBankCompliance } from "@/lib/credit-hub/hooks/useBankDecision";

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, use: (value: unknown) => value };
});

jest.mock("@/components/forge/credit-hub/BankApplicationDetailView", () => ({
  BankApplicationDetailView: () => <div>Detalle bancario renderizado</div>,
}));

jest.mock("@/lib/credit-hub/hooks/useBankDecision", () => ({
  useBankApplication: jest.fn(),
  useBankAuditTrail: jest.fn(),
  useBankCompliance: jest.fn(),
}));

describe("Bank detail review page", () => {
  test("renders detail view after loading application", () => {
    (useBankApplication as jest.Mock).mockReturnValue({ isLoading: false, error: null, data: { application_id: "app-1" } });
    (useBankCompliance as jest.Mock).mockReturnValue({ data: undefined });
    (useBankAuditTrail as jest.Mock).mockReturnValue({ data: undefined });
    render(<BankApplicationReviewPage params={{ applicationId: "app-1" } as never} />);
    expect(screen.getByText("Detalle bancario renderizado")).toBeInTheDocument();
  });
});
