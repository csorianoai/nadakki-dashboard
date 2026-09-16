/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { CoreNavigation, CORE_NAV_CAPABILITY_KEYS } from "@/components/dealer/CoreNavigation";
import { ACCESS_ENDPOINTS } from "@/lib/access/client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { refreshAccessToken } from "@/lib/auth/token-refresh";
import {
  resetDealerAccessMemoryForTests,
  setDealerAccessContext,
} from "@/lib/dealer/access-context";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

function jsonResponse(body: unknown, status: number) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function batchOk(overrides: Record<string, { allowed: boolean; reason_code: string; limit?: number | null; current_usage?: number | null }>) {
  const results: Record<string, unknown> = {};
  for (const key of CORE_NAV_CAPABILITY_KEYS) {
    results[key] = overrides[key] ?? { allowed: false, reason_code: "DEFAULT_DENY", limit: null, current_usage: null };
  }
  return { results };
}

function seedDealer(tenantId: string, dealerId: string, organizationUnitId: string) {
  window.localStorage.setItem("nadakki_tenant_id", tenantId);
  setDealerAccessContext({ tenantId, dealerId, organizationUnitId });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("DASH-ACCESS-ADOPTION-01 CoreNavigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    (refreshAccessToken as jest.Mock).mockClear();
    global.fetch = jest.fn();
    seedDealer("tenant-a", "dealer-a", "ou-a");
  });

  test("T1 entitlements callsite uses canonical batch client", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(batchOk({
      "autos.inventory.view": { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null },
    }), 200));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(screen.getByTestId("core-navigation")).toBeInTheDocument());
    const url = String((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(url).toContain(ACCESS_ENDPOINTS.batch);
    expect(url).not.toContain("/api/v1/autos/entitlements");
  });

  test("T2 tenant A -> B forces a new read", async () => {
    const client = newClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(batchOk({
        "autos.inventory.view": { allowed: true, reason_code: "TENANT_A", limit: null, current_usage: null },
      }), 200))
      .mockResolvedValueOnce(jsonResponse(batchOk({
        "autos.inventory.view": { allowed: true, reason_code: "TENANT_B", limit: null, current_usage: null },
      }), 200));
    const { rerender } = render(<CoreNavigation />, { wrapper: wrapperFor(client) });
    await waitFor(() => expect(document.querySelector('[data-reason-code="TENANT_A"]')).toBeTruthy());
    seedDealer("tenant-b", "dealer-a", "ou-a");
    rerender(<CoreNavigation />);
    await waitFor(() => expect(document.querySelector('[data-reason-code="TENANT_B"]')).toBeTruthy());
    expect(document.querySelector('[data-reason-code="TENANT_A"]')).toBeNull();
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
  });

  test("T3 dealer A -> B does not reuse cache A", async () => {
    const client = newClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(batchOk({
        "autos.inventory.view": { allowed: true, reason_code: "DEALER_A", limit: null, current_usage: null },
      }), 200))
      .mockResolvedValueOnce(jsonResponse(batchOk({
        "autos.inventory.view": { allowed: true, reason_code: "DEALER_B", limit: null, current_usage: null },
      }), 200));
    const { rerender } = render(<CoreNavigation />, { wrapper: wrapperFor(client) });
    await waitFor(() => expect(document.querySelector('[data-reason-code="DEALER_A"]')).toBeTruthy());
    seedDealer("tenant-a", "dealer-b", "ou-b");
    rerender(<CoreNavigation />);
    await waitFor(() => expect(document.querySelector('[data-reason-code="DEALER_B"]')).toBeTruthy());
    expect(document.querySelector('[data-reason-code="DEALER_A"]')).toBeNull();
  });

  test("T4 403 at callsite does not logout", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({
      detail: { reason_code: "NO_ORGANIZATION_UNIT" },
    }, 403));
    const clearSpy = jest.spyOn(tokenStorage, "clearTokens");
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(document.querySelector('[data-reason-code="NO_ORGANIZATION_UNIT"]')).toBeTruthy());
    expect(screen.queryByText(/Available/)).not.toBeInTheDocument();
    expect(clearSpy).not.toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  test("T5 TARGET_CORE_NOT_READY is not allowed=true", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({
      detail: { reason_code: "TARGET_CORE_NOT_READY", capability: "credit.scoring.run" },
    }, 501));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(document.querySelector('[data-reason-code="TARGET_CORE_NOT_READY"]')).toBeTruthy());
    expect(document.querySelector('[data-allowed="true"]')).toBeNull();
    expect(screen.queryByText(/Available/)).not.toBeInTheDocument();
  });

  test("T7 absent tenant makes zero network calls", async () => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await Promise.resolve();
    await Promise.resolve();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  test("T8 tenant batch is not presented as dealer authorization", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(batchOk({
      "autos.inventory.view": { allowed: true, reason_code: "ALLOWED", limit: 10, current_usage: 7 },
    }), 200));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(screen.getByTestId("core-navigation")).toBeInTheDocument());
    const nav = screen.getByTestId("core-navigation");
    expect(nav).toHaveAttribute("data-access-scope", "tenant");
    expect(nav).toHaveAttribute("data-unit-scope", "UNIT_SCOPE_UNSUPPORTED");
    expect(nav).toHaveAttribute("data-dealer-authorized", "false");
    const dump = `${(global.fetch as jest.Mock).mock.calls[0][0]} ${JSON.stringify((global.fetch as jest.Mock).mock.calls[0][1]?.headers)}`;
    expect(dump).not.toMatch(/dealer_id/);
    expect(dump).not.toMatch(/organization_unit_id/);
    expect(screen.getByText(/7 \/ 10 used/)).toBeInTheDocument();
  });
});
