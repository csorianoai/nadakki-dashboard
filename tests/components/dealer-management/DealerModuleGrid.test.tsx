/** @jest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { DealerModuleGrid, DEALER_MANAGEMENT_CAPABILITIES } from "@/components/dealer-management/DealerModuleGrid";
import { tokenStorage } from "@/lib/auth/token-storage";

jest.mock("@/lib/auth-context", () => ({ useAuth: () => ({ isAuthenticated: true, role: "dealer", tenantId: "" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));
function jsonResponse(body: unknown, status = 200) { return { ok: status >= 200 && status < 300, status, json: async () => body }; }
function wrapper(client: QueryClient) { return function Wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }; }

describe("DealerModuleGrid authority", () => {
  beforeEach(() => { tokenStorage.clearTokens(); global.fetch = jest.fn(); });
  test("renders allowed links only from backend decisions", async () => {
    const results = Object.fromEntries(DEALER_MANAGEMENT_CAPABILITIES.map((cap) => [cap, { allowed: cap === "autos.inventory.list", reason_code: cap === "autos.inventory.list" ? "ALLOWED" : "DEFAULT_DENY" }]));
    global.fetch = jest.fn(async (input: RequestInfo | URL) => String(input).includes("/api/v1/access/entitlements/batch") ? jsonResponse({ results }) : jsonResponse({}, 404));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<DealerModuleGrid />, { wrapper: wrapper(client) });
    await waitFor(() => expect(screen.getByTestId("dealer-module-inventory")).toHaveAttribute("data-allowed", "true"));
    expect(screen.getByTestId("dealer-module-inventory")).toHaveAttribute("href", "/autos/dealer/inventario");
    expect(screen.getByTestId("dealer-module-marketing")).toHaveAttribute("data-allowed", "false");
  });
  test("fails closed when entitlement request fails", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ detail: "denied" }, 403));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<DealerModuleGrid />, { wrapper: wrapper(client) });
    await waitFor(() => expect(screen.getByTestId("dealer-module-dealer-bank")).toHaveAttribute("data-allowed", "false"));
    expect(document.querySelector('[data-allowed="true"]')).toBeNull();
  });
});
