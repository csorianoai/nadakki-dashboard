import { render, screen } from "@testing-library/react";
import { FinanceSubNav } from "@/components/cockpit/finance/FinanceSubNav";
import { COCKPIT_FINANCE_FLAGS } from "@/lib/cockpit/finance-v3/flags";

const mockUseCockpit = jest.fn();
const mockUsePathname = jest.fn();

jest.mock("@/lib/cockpit/context", () => ({
  useCockpit: () => mockUseCockpit(),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("finance golden paths — component RBAC F7", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/cockpit/finance/revenue");
  });

  test("superadmin sees registry tab when flag ON", () => {
    mockUseCockpit.mockReturnValue({ isPlatformSuperadmin: true });
    render(<FinanceSubNav />);
    expect(screen.getByRole("link", { name: /registro/i })).toBeInTheDocument();
  });

  test("tenant_admin does not see registry tab", () => {
    mockUseCockpit.mockReturnValue({ isPlatformSuperadmin: false });
    render(<FinanceSubNav />);
    expect(screen.queryByRole("link", { name: /registro/i })).not.toBeInTheDocument();
  });

  test("matrix tab visible when COCKPIT_FINANCE_MATRIX_ENABLED", () => {
    mockUseCockpit.mockReturnValue({ isPlatformSuperadmin: true });
    render(<FinanceSubNav />);
    if (COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_MATRIX_ENABLED) {
      expect(screen.getByRole("link", { name: /matriz/i })).toBeInTheDocument();
    }
  });
});
