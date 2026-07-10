import { render, screen } from "@testing-library/react";
import { CHAdminAccessGuard } from "@/components/credit-hub/system/CHAdminAccessGuard";

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "@/hooks/useAuth";

const mockUseAuth = useAuth as jest.Mock;

describe("CHAdminAccessGuard", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  test("shows 403 for dealer role", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      activeRole: { role_key: "dealer", display_name: "Dealer" },
    });
    render(
      <CHAdminAccessGuard>
        <div>Admin content</div>
      </CHAdminAccessGuard>,
    );
    expect(screen.getByTestId("ch-admin-forbidden")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  test("renders children for platform_superadmin", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      activeRole: { role_key: "platform_superadmin", display_name: "Super" },
    });
    render(
      <CHAdminAccessGuard>
        <div>Admin content</div>
      </CHAdminAccessGuard>,
    );
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
