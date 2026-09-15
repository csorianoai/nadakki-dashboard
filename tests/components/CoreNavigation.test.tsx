import { render, screen, waitFor } from "@testing-library/react";
import { CoreNavigation } from "@/components/dealer/CoreNavigation";
import { entitlementsAPI } from "@/lib/autos-portal/entitlements-api";

jest.mock("@/lib/autos-portal/entitlements-api", () => ({
  entitlementsAPI: {
    getContext: jest.fn(),
    getContextResult: jest.fn(),
  },
}));

describe("CoreNavigation", () => {
  test("renders available capabilities as links", async () => {
    (entitlementsAPI.getContextResult as jest.Mock).mockResolvedValueOnce({
      context: {
        capabilities: {
          "autos.inventory.view": { allowed: true, reason_code: "ALLOWED" },
          "marketing.campaigns.create": { allowed: false, reason_code: "UPGRADE_REQUIRED" },
          "accounting.commissions.view": {
            allowed: false,
            reason_code: "TARGET_CORE_NOT_READY",
            target_readiness: "BLOCKED",
          },
        },
      },
      reason_code: null,
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
    (entitlementsAPI.getContextResult as jest.Mock).mockResolvedValueOnce({
      context: {
        capabilities: {
          "marketing.campaigns.create": {
            allowed: true,
            reason_code: "ALLOWED",
            limit: 10,
            used: 7,
          },
        },
      },
      reason_code: null,
    });

    render(<CoreNavigation />);

    await waitFor(() => {
      expect(screen.getByText(/7 \/ 10 used/)).toBeInTheDocument();
    });
  });

  test("keeps NO_ORGANIZATION_UNIT on the UI decision layer", async () => {
    (entitlementsAPI.getContextResult as jest.Mock).mockResolvedValueOnce({
      context: null,
      reason_code: "NO_ORGANIZATION_UNIT",
    });

    render(<CoreNavigation />);

    await waitFor(() => {
      expect(screen.getAllByText(/No organization unit/).length).toBeGreaterThan(0);
    });

    expect(screen.queryByText(/Available/)).not.toBeInTheDocument();
    expect(document.querySelector('[data-reason-code="NO_ORGANIZATION_UNIT"]')).toBeTruthy();
    expect(document.querySelector('[data-reason-code="DEFAULT_DENY"]')).toBeNull();
    expect(document.querySelector('[data-reason-code="UNKNOWN_ERROR"]')).toBeNull();
  });

  test("does not show available capabilities when dealer context is missing", async () => {
    (entitlementsAPI.getContextResult as jest.Mock).mockResolvedValueOnce({
      context: null,
      reason_code: "DEFAULT_DENY",
    });

    render(<CoreNavigation />);

    await waitFor(() => {
      expect(screen.getAllByText(/Locked/).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/Available/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
