/** @jest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerDashboardPage from "@/app/autos/dealer/page";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("@/lib/auth-context", () => ({ useAuth: () => ({ isAuthenticated: true, role: "dealer", tenantId: "tenant-a" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));
jest.mock("@/lib/dealer/post-sale", () => ({ fetchPostSaleSnapshot: jest.fn(async () => ({ cases: [], asientos: [], listings: [], heartbeat: {} })) }));
function response(body: unknown, status = 200) { return { ok: status >= 200 && status < 300, status, json: async () => body }; }
function wrapper(client: QueryClient) { return function Wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }; }
function client() { return new QueryClient({ defaultOptions: { queries: { retry: false } } }); }
function seedDealer() { window.localStorage.setItem("nadakki_tenant_id", "tenant-a"); setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" }); }

describe("Dealer Management quick-link authority", () => {
  beforeEach(() => { window.localStorage.clear(); resetDealerAccessMemoryForTests(); tokenStorage.clearTokens(); seedDealer(); });
  test("allowed capabilities render their exact links and fake KPI copy is absent", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/branding")) return response({ display_name: "Dealer A" });
      if (url.includes("/sponsorship")) return response({ sponsorships: [] });
      if (url.includes("/subscription")) return response({ has_subscription: false, subscription: null });
      if (url.includes("/entitlements/batch")) return response({ results: {
        "autos.inventory.create": { allowed: true, reason_code: "ALLOWED" },
        "autos.leads.crm": { allowed: true, reason_code: "ALLOWED" },
        "autos.analytics.basic": { allowed: true, reason_code: "ALLOWED" },
      }});
      return response({}, 404);
    });
    render(<DealerDashboardPage />, { wrapper: wrapper(client()) });
    await waitFor(() => expect(screen.getAllByTestId("privileged-quick-link")).toHaveLength(3));
    expect(screen.queryByText(/12 hot/i)).toBeNull();
    expect(screen.queryByText(/3 sin revisar/i)).toBeNull();
    expect(screen.getByText("Dealer A")).toBeInTheDocument();
  });
  test("403 fails closed with zero privileged links", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/branding")) return response({}, 404);
      if (url.includes("/sponsorship")) return response({ sponsorships: [] });
      if (url.includes("/subscription")) return response({ has_subscription: false, subscription: null });
      if (url.includes("/entitlements/batch")) return response({ detail: "denied" }, 403);
      return response({}, 404);
    });
    render(<DealerDashboardPage />, { wrapper: wrapper(client()) });
    await waitFor(() => expect(screen.getByTestId("dealer-quick-links")).toHaveAttribute("data-fail-closed", "true"));
    expect(screen.queryAllByTestId("privileged-quick-link")).toHaveLength(0);
  });
});
