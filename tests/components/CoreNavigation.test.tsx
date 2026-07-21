import { render, screen, waitFor } from "@testing-library/react";
import { CoreNavigation } from "@/components/dealer/CoreNavigation";
import { entitlementsAPI } from "@/lib/autos-portal/entitlements-api";

jest.mock("@/lib/autos-portal/entitlements-api", () => ({
  entitlementsAPI: {
    getContext: jest.fn(),
  },
}));

describe("CoreNavigation", () => {
  test("renders available capabilities as links", async () => {
    (entitlementsAPI.getContext as jest.Mock).mockResolvedValueOnce({
      capabilities: {
        "autos.inventory.view": { allowed: true, reason_code: "ALLOWED" },
        "marketing.campaigns.create": { allowed: false, reason_code: "UPGRADE_REQUIRED" },
        "accounting.commissions.view": {
          allowed: false,
          reason_code: "TARGET_CORE_NOT_READY",
          target_readiness: "BLOCKED",
        },
      },
    });

    render(<CoreNavigation />);

    await waitFor(() => {
      expect(screen.getByText(/Inventory/)).toBeInTheDocument();
      expect(screen.getByText(/Marketing/)).toBeInTheDocument();
      expect(screen.getByText(/Accounting/)).toBeInTheDocument();
    });

    const inventoryLink = screen.getByText(/✅ Inventory/).closest("a");
    expect(inventoryLink).toHaveAttribute("href");

    expect(screen.getByText(/Coming Soon/)).toBeInTheDocument();
  });

  test("shows usage limits", async () => {
    (entitlementsAPI.getContext as jest.Mock).mockResolvedValueOnce({
      capabilities: {
        "marketing.campaigns.create": {
          allowed: true,
          reason_code: "ALLOWED",
          limit: 10,
          used: 7,
        },
      },
    });

    render(<CoreNavigation />);

    await waitFor(() => {
      expect(screen.getByText(/7 \/ 10 used/)).toBeInTheDocument();
    });
  });
});
