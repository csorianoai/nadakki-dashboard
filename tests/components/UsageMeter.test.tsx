import { render, screen, waitFor } from "@testing-library/react";
import { UsageMeter } from "@/components/dealer/UsageMeter";
import { entitlementsAPI } from "@/lib/autos-portal/entitlements-api";

jest.mock("@/lib/autos-portal/entitlements-api", () => ({
  entitlementsAPI: {
    getContext: jest.fn(),
  },
}));

describe("UsageMeter", () => {
  test("displays usage metrics", async () => {
    (entitlementsAPI.getContext as jest.Mock).mockResolvedValueOnce({
      usage: {
        "marketing.campaigns.create": { used: 7, limit: 10 },
        "legal.quick_check": { used: 5, limit: 20 },
      },
    });

    render(<UsageMeter />);

    await waitFor(() => {
      expect(screen.getByText(/Marketing Campaigns Create/)).toBeInTheDocument();
      expect(screen.getByText("7/10")).toBeInTheDocument();
      expect(screen.getByText("5/20")).toBeInTheDocument();
    });
  });

  test("shows warning at 80% usage", async () => {
    (entitlementsAPI.getContext as jest.Mock).mockResolvedValueOnce({
      usage: {
        "marketing.campaigns.create": { used: 8, limit: 10 },
      },
    });

    render(<UsageMeter />);

    await waitFor(() => {
      expect(screen.getByText(/⚠️/)).toBeInTheDocument();
      expect(screen.getByText(/20% restante/)).toBeInTheDocument();
    });
  });

  test("handles unlimited capabilities", async () => {
    (entitlementsAPI.getContext as jest.Mock).mockResolvedValueOnce({
      usage: {
        "credit.applications.create": { used: 100, limit: null },
      },
    });

    render(<UsageMeter />);

    await waitFor(() => {
      expect(screen.getByText(/100\/∞/)).toBeInTheDocument();
    });
  });
});
