/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerInventarioPage from "@/app/autos/dealer/inventario/page";
import { DEALER_INVENTORY_LIST_PATH, PUBLIC_MARKETPLACE_SEARCH_PATH } from "@/lib/dealer/inventory-search";
import { tokenStorage } from "@/lib/auth/token-storage";
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

function seedDealer() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function routeFetch(impl: (url: string) => { body: unknown; status: number }) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const { body, status } = impl(url);
    return jsonResponse(body, status) as Response;
  });
}

describe("Dealer inventario surface", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
  });

  test("allowed batch then BLOCKED_BY_BACKEND missing GET; never calls marketplace search", async () => {
    routeFetch((url) => {
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return {
          status: 200,
          body: {
            results: {
              "autos.inventory.view": {
                allowed: true,
                reason_code: "ALLOWED",
                limit: null,
                current_usage: null,
              },
            },
          },
        };
      }
      return { status: 500, body: { unexpected: true } };
    });
    render(<DealerInventarioPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() =>
      expect(screen.getByTestId("dealer-inventory-blocked-by-backend")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("dealer-inventory-blocked-by-backend")).toHaveAttribute(
      "data-blocked-by-backend",
      "true",
    );
    expect(screen.getByText(new RegExp(DEALER_INVENTORY_LIST_PATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes(PUBLIC_MARKETPLACE_SEARCH_PATH))).toBe(false);
    expect(urls.some((u) => u.includes("/api/v1/autos/vehicles/"))).toBe(false);
  });

  test("BLOCKED keeps reason_code and does not fetch vehicles", async () => {
    routeFetch((url) => {
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return {
          status: 200,
          body: {
            results: {
              "autos.inventory.view": {
                allowed: false,
                reason_code: "UPGRADE_REQUIRED",
                limit: null,
                current_usage: null,
              },
            },
          },
        };
      }
      return { status: 500, body: { unexpected: true } };
    });
    render(<DealerInventarioPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() => expect(screen.getByTestId("dealer-reason-panel")).toBeInTheDocument());
    expect(screen.getByTestId("dealer-reason-panel")).toHaveAttribute("data-reason-code", "UPGRADE_REQUIRED");
    expect(screen.queryByTestId("dealer-inventory-blocked-by-backend")).not.toBeInTheDocument();
  });

  test("ERROR 403 surfaces reason_code before any vehicle fetch", async () => {
    routeFetch(() => ({
      status: 403,
      body: { detail: { reason_code: "NO_ORGANIZATION_UNIT" } },
    }));
    render(<DealerInventarioPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() => expect(screen.getByTestId("dealer-reason-panel")).toBeInTheDocument());
    expect(screen.getByTestId("dealer-reason-panel")).toHaveAttribute("data-reason-code", "NO_ORGANIZATION_UNIT");
    expect(screen.getByTestId("dealer-reason-panel")).toHaveAttribute("data-http-status", "403");
  });
});
