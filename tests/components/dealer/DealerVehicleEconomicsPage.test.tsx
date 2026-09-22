/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerVehicleEconomicsPage from "@/app/autos/dealer/inventario/[vehicleId]/page";
import { DMS02R_HTTP_IN_PRODUCTION_OPENAPI } from "@/lib/dealer/dms02r-http";
import { tokenStorage } from "@/lib/auth/token-storage";
import {
  resetDealerAccessMemoryForTests,
  setDealerAccessContext,
} from "@/lib/dealer/access-context";

jest.mock("next/navigation", () => ({
  useParams: () => ({ vehicleId: "veh-1" }),
}));

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

function jsonResponse(body: unknown, status: number) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("Dealer vehicle economics", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
  });

  test("economics stay blocked until #1365 publishes", () => {
    expect(DMS02R_HTTP_IN_PRODUCTION_OPENAPI).toBe(false);
  });

  test("gate then private GET ficha; economics BLOCKED; never marketplace GET", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return jsonResponse(
          {
            results: {
              "autos.inventory.list": {
                allowed: true,
                reason_code: "ALLOWED",
                limit: null,
                current_usage: null,
              },
            },
          },
          200,
        ) as Response;
      }
      if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles/veh-1")) {
        return jsonResponse(
          {
            id: "veh-1",
            dealer_id: "dealer-a",
            make: "Toyota",
            model: "Corolla",
            year: 2020,
            status: "reservado",
          },
          200,
        ) as Response;
      }
      return jsonResponse({ unexpected: true }, 500) as Response;
    });
    render(<DealerVehicleEconomicsPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() => expect(screen.getByTestId("dealer-vehicle-ready")).toBeInTheDocument());
    expect(screen.getByText(/reservado/)).toBeInTheDocument();
    expect(screen.getByTestId("dealer-economics-blocked")).toHaveAttribute("data-blocked-by-backend", "true");
    expect(screen.getByText(/\/api\/v1\/autos\/vehicles\/\{vehicle_id\}\/margin/)).toBeInTheDocument();
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => /\/api\/v1\/autos\/vehicles\/veh-1$/.test(u))).toBe(false);
    expect(urls.some((u) => u.includes("/margin") || u.includes("/days"))).toBe(false);
  });

  test("batch deny gates before any vehicle fetch", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return jsonResponse(
          {
            results: {
              "autos.inventory.list": {
                allowed: false,
                reason_code: "UPGRADE_REQUIRED",
                limit: null,
                current_usage: null,
              },
            },
          },
          200,
        ) as Response;
      }
      return jsonResponse({ unexpected: true }, 500) as Response;
    });
    render(<DealerVehicleEconomicsPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() => expect(screen.getByTestId("dealer-vehicle-gated")).toBeInTheDocument());
    expect(screen.getByTestId("dealer-vehicle-gated")).toHaveAttribute("data-reason-code", "UPGRADE_REQUIRED");
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/api/v1/autos/dealers/"))).toBe(false);
  });
});
