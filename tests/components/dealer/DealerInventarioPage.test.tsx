/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerInventarioPage from "@/app/autos/dealer/inventario/page";
import { PUBLIC_MARKETPLACE_SEARCH_PATH } from "@/lib/dealer/inventory-search";
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

  test("READY lists all statuses from private GET and never marketplace search", async () => {
    routeFetch((url) => {
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return {
          status: 200,
          body: {
            results: {
              "autos.inventory.list": {
                allowed: true,
                reason_code: "ALLOWED",
                limit: null,
                current_usage: null,
              },
            },
          },
        };
      }
      if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles") && !url.includes("/veh-")) {
        return {
          status: 200,
          body: {
            vehicles: [
              {
                id: "v-mine",
                dealer_id: "dealer-a",
                make: "Toyota",
                model: "Corolla",
                year: 2020,
                status: "reservado",
                price_rd: 890000,
              },
              {
                id: "v-sold",
                dealer_id: "dealer-a",
                make: "Kia",
                model: "Rio",
                year: 2019,
                status: "vendido",
                price_rd: 410000,
              },
              {
                id: "v-other",
                dealer_id: "dealer-b",
                make: "Honda",
                status: "disponible",
              },
            ],
          },
        };
      }
      return { status: 500, body: { unexpected: true } };
    });
    render(<DealerInventarioPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() => expect(screen.getByTestId("dealer-inventory-ready")).toBeInTheDocument());
    expect(screen.getByText(/Toyota/)).toBeInTheDocument();
    expect(screen.getByText(/reservado/)).toBeInTheDocument();
    expect(screen.getByText(/vendido/)).toBeInTheDocument();
    expect(screen.queryByText(/Honda/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("dealer-inventory-blocked-by-backend")).not.toBeInTheDocument();
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes(PUBLIC_MARKETPLACE_SEARCH_PATH))).toBe(false);
    expect(urls.some((u) => u.includes("/api/v1/autos/dealers/dealer-a/vehicles"))).toBe(true);
  });

  test("BLOCKED keeps reason_code and does not fetch vehicles", async () => {
    routeFetch((url) => {
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return {
          status: 200,
          body: {
            results: {
              "autos.inventory.list": {
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
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/api/v1/autos/dealers/"))).toBe(false);
  });
});
