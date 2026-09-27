/** @jest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { DealerModuleGrid, DEALER_MANAGEMENT_CAPABILITIES } from "@/components/dealer-management/DealerModuleGrid";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("@/lib/auth-context", () => ({ useAuth: () => ({ isAuthenticated: true, role: "dealer", tenantId: "tenant-a" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));
function jsonResponse(body: unknown, status = 200) { return { ok: status >= 200 && status < 300, status, json: async () => body }; }
function wrapper(client: QueryClient) { return function Wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }; }
function seedDealer() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
}
function testClient() { return new QueryClient({ defaultOptions: { queries: { retry: false } } }); }

describe("DealerModuleGrid authority", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    global.fetch = jest.fn();
    seedDealer();
  });
  test("renders allowed links only from backend decisions", async () => {
    const results = Object.fromEntries(DEALER_MANAGEMENT_CAPABILITIES.map((cap) => [cap, { allowed: cap === "autos.inventory.list", reason_code: cap === "autos.inventory.list" ? "ALLOWED" : "DEFAULT_DENY" }]));
    global.fetch = jest.fn(async (input: RequestInfo | URL) => String(input).includes("/api/v1/access/entitlements/batch") ? jsonResponse({ results }) : jsonResponse({}, 404));
    const client = testClient();
    render(<DealerModuleGrid />, { wrapper: wrapper(client) });
    await waitFor(() => expect(screen.getByTestId("dealer-module-inventory")).toHaveAttribute("data-allowed", "true"));
    expect(screen.getByTestId("dealer-module-inventory")).toHaveAttribute("href", "/autos/dealer/inventario");
    expect(screen.getByTestId("dealer-module-marketing")).toHaveAttribute("data-allowed", "false");
  });
  test("fails closed when entitlement request fails", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => String(input).includes("/branding") ? jsonResponse({}, 404) : jsonResponse({ detail: "denied" }, 403));
    const client = testClient();
    render(<DealerModuleGrid />, { wrapper: wrapper(client) });
    await waitFor(() => expect(screen.getByTestId("dealer-module-dealer-bank")).toHaveAttribute("data-allowed", "false"));
    expect(document.querySelector('[data-allowed="true"]')).toBeNull();
  });
  test("fails closed when backend omits a capability decision", async () => {
    const results = { "autos.inventory.list": { allowed: true, reason_code: "ALLOWED" } };
    global.fetch = jest.fn(async (input: RequestInfo | URL) => String(input).includes("/api/v1/access/entitlements/batch") ? jsonResponse({ results }) : jsonResponse({}, 404));
    const client = testClient();
    render(<DealerModuleGrid />, { wrapper: wrapper(client) });
    await waitFor(() => expect(screen.getByTestId("dealer-module-inventory")).toHaveAttribute("data-allowed", "true"));
    expect(screen.getByTestId("dealer-module-marketing")).toHaveAttribute("data-allowed", "false");
    expect(screen.getByTestId("dealer-module-marketing")).toHaveAttribute("data-reason-code", "DEFAULT_DENY");
  });
  test("restricts Legal for Argentina even when backend capability is allowed", async () => {
    const results = Object.fromEntries(DEALER_MANAGEMENT_CAPABILITIES.map((cap) => [cap, { allowed: true, reason_code: "ALLOWED" }]));
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/entitlements/batch")) return jsonResponse({ results });
      if (url.includes("/api/v2/tenants/tenant-a/branding")) return jsonResponse({ display_name: "Dealer AR", currency: "ARS", locale: "es-AR" });
      return jsonResponse({}, 404);
    });
    const client = testClient();
    render(<DealerModuleGrid />, { wrapper: wrapper(client) });
    await waitFor(() => expect(screen.getByTestId("dealer-module-legal")).toHaveAttribute("data-reason-code", "COUNTRY_PACK_AR_GAP"));
    expect(screen.getByTestId("dealer-module-legal")).toHaveAttribute("data-allowed", "false");
    expect(screen.getByTestId("dealer-module-legal")).toHaveTextContent("Sin paquete jurídico Argentina");
  });
});
