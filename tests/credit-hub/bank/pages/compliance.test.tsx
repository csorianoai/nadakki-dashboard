import { render, screen } from "@testing-library/react";
import BankCompliancePage from "@/app/(forge)/credit-hub/bank/compliance/page";
import { useBankGlobalCompliance } from "@/lib/credit-hub/hooks/useBankAuditCompliance";

// PR-FE-6: the page now consumes the real aggregated compliance hook
// (per-application /compliance/{id}) instead of synthesizing from the queue.
jest.mock("@/lib/credit-hub/hooks/useBankAuditCompliance", () => ({
  useBankGlobalCompliance: jest.fn(),
}));

// Isolate the page from the auth-coupled tenant branding chain.
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({
    tenantConfig: { country_code: "DO", institution_name: "Banco de Prueba" },
    loading: false,
  }),
}));

describe("Bank compliance page", () => {
  test("shows compliance dashboard", () => {
    (useBankGlobalCompliance as jest.Mock).mockReturnValue({
      issues: [],
      reviewedCount: 0,
      isLoading: false,
      isError: false,
      isPartialCoverage: false,
      refetch: jest.fn(),
    });
    render(<BankCompliancePage />);
    expect(screen.getByText(/Ley 172-13/)).toBeInTheDocument();
    expect(screen.getByText(/Derecho al olvido/)).toBeInTheDocument();
  });
});
