import { render, screen } from "@testing-library/react";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: jest.fn(),
}));

const mockUseTenant = useTenant as jest.Mock;

describe("CHTenantGuard", () => {
  beforeEach(() => {
    mockUseTenant.mockReset();
  });

  test("shows guard when no tenant", () => {
    mockUseTenant.mockReturnValue({ tenantId: null, tenantSlug: null, loading: false });
    render(
      <div data-portal="dealer">
        <CHTenantGuard>Protected</CHTenantGuard>
      </div>
    );

    expect(screen.getByText("Selecciona tu organización")).toBeInTheDocument();
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  test("renders children when tenant exists", () => {
    mockUseTenant.mockReturnValue({ tenantId: "tenant-1", tenantSlug: "tenant-1", loading: false });
    render(<CHTenantGuard>Protected</CHTenantGuard>);

    expect(screen.getByText("Protected")).toBeInTheDocument();
  });
});
