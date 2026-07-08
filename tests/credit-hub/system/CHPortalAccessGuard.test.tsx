import { render, screen } from "@testing-library/react";
import { CHPortalAccessGuard } from "@/components/credit-hub/system/CHPortalAccessGuard";

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "@/hooks/useAuth";

const mockUseAuth = useAuth as jest.Mock;

describe("CHPortalAccessGuard", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  test("shows 403 for bank_analyst on dealer portal", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      activeRole: { role_key: "bank_analyst", display_name: "Analyst" },
    });
    render(
      <CHPortalAccessGuard portal="dealer">
        <div>Dealer content</div>
      </CHPortalAccessGuard>,
    );
    expect(screen.getByTestId("ch-portal-forbidden")).toBeInTheDocument();
    expect(screen.queryByText("Dealer content")).not.toBeInTheDocument();
  });

  test("renders children for credit_admin on dealer portal", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      activeRole: { role_key: "credit_admin", display_name: "Credit Admin" },
    });
    render(
      <CHPortalAccessGuard portal="dealer">
        <div>Dealer content</div>
      </CHPortalAccessGuard>,
    );
    expect(screen.getByText("Dealer content")).toBeInTheDocument();
  });
});
