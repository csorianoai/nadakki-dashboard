/**
 * @jest-environment jsdom
 */

import fs from "fs";
import path from "path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerVehicleEconomicsPage from "@/app/autos/dealer/inventario/[vehicleId]/page";
import { DEALER_VEHICLE_CAPABILITY } from "@/lib/dealer/capabilities";
import { tokenStorage } from "@/lib/auth/token-storage";
import {
  resetDealerAccessMemoryForTests,
  setDealerAccessContext,
} from "@/lib/dealer/access-context";
import { parseVehicleDays, parseVehicleMarginRow } from "@/lib/dealer/vehicle-economics";

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

function seedDealer() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function allowBatch() {
  return jsonResponse(
    {
      results: {
        [DEALER_VEHICLE_CAPABILITY]: {
          allowed: true,
          reason_code: "ALLOWED",
          limit: null,
          current_usage: null,
        },
      },
    },
    200,
  );
}

describe("Dealer vehicle economics", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
  });

  test("parses commercial margin and days; drops unknown legal fields", () => {
    expect(
      parseVehicleMarginRow({
        currency: "DOP",
        sale_price_amount: "1000",
        total_cost: "700",
        margin: "300",
        payer_account_id: "secret",
      }),
    ).toEqual({
      currency: "DOP",
      sale_price_amount: "1000",
      total_cost: "700",
      margin: "300",
    });
    expect(parseVehicleDays({ acquired_at: "2026-01-01T00:00:00Z", days_in_inventory: 12 })).toEqual({
      acquired_at: "2026-01-01T00:00:00Z",
      days_in_inventory: 12,
    });
  });

  test("READY shows ficha plus backend margin and days; never BLOCKED_BY_BACKEND", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/entitlements/batch")) return allowBatch();
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
        );
      }
      if (url.includes("/margin")) {
        return jsonResponse(
          [{ currency: "DOP", sale_price_amount: "1000", total_cost: "700", margin: "300" }],
          200,
        );
      }
      if (url.includes("/days")) {
        return jsonResponse({ acquired_at: "2026-01-01T00:00:00Z", days_in_inventory: 12 }, 200);
      }
      return jsonResponse({ detail: "not-mocked" }, 404);
    });
    render(<DealerVehicleEconomicsPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    expect(await screen.findByTestId("dealer-vehicle-ready")).toBeInTheDocument();
    expect(screen.getByText(/reservado/)).toBeInTheDocument();
    expect(await screen.findByTestId("dealer-economics-ready")).toBeInTheDocument();
    expect(screen.getByText(/margen 300/)).toBeInTheDocument();
    expect(screen.getByText(/Días en inventario: 12/)).toBeInTheDocument();
    expect(screen.queryByText(/BLOCKED_BY_BACKEND/)).not.toBeInTheDocument();
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => /\/api\/v1\/autos\/vehicles\/veh-1$/.test(u))).toBe(false);
    expect(urls.some((u) => u.includes("/api/v1/autos/vehicles/veh-1/margin"))).toBe(true);
    expect(urls.some((u) => u.includes("/api/v1/autos/vehicles/veh-1/days"))).toBe(true);
  });

  test("batch deny gates before any vehicle fetch", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return jsonResponse(
          {
            results: {
              [DEALER_VEHICLE_CAPABILITY]: {
                allowed: false,
                reason_code: "UPGRADE_REQUIRED",
                limit: null,
                current_usage: null,
              },
            },
          },
          200,
        );
      }
      return jsonResponse({ unexpected: true }, 500);
    });
    render(<DealerVehicleEconomicsPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() => expect(screen.getByTestId("dealer-vehicle-gated")).toBeInTheDocument());
    expect(screen.getByTestId("dealer-vehicle-gated")).toHaveAttribute("data-reason-code", "UPGRADE_REQUIRED");
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/api/v1/autos/dealers/"))).toBe(false);
    expect(urls.some((u) => u.includes("/margin") || u.includes("/days"))).toBe(false);
  });

  test("ERROR fail-closed on 403 economics GET", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/entitlements/batch")) return allowBatch();
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
        );
      }
      return jsonResponse({ detail: { reason_code: "DEALER_NOT_ASSIGNED" } }, 403);
    });
    render(<DealerVehicleEconomicsPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() => expect(screen.getByTestId("dealer-economics-error")).toBeInTheDocument());
    expect(screen.getByTestId("dealer-economics-error")).toHaveAttribute("data-reason-code", "DEALER_NOT_ASSIGNED");
  });

  test("NO_FAKE_DATA: invented margin and days fail the suite", async () => {
    const pageSrc = fs.readFileSync(
      path.join(process.cwd(), "app/autos/dealer/inventario/[vehicleId]/page.tsx"),
      "utf8",
    );
    const panelSrc = fs.readFileSync(
      path.join(process.cwd(), "components/dealer/DealerVehicleEconomicsPanel.tsx"),
      "utf8",
    );
    expect(pageSrc).not.toMatch(/RD\$/);
    expect(pageSrc).not.toMatch(/5,000/);
    expect(pageSrc).not.toMatch(/D[ií]as en inventario:\s*37/i);
    expect(panelSrc).not.toMatch(/RD\$/);
    expect(panelSrc).not.toMatch(/5,000/);
    expect(pageSrc).not.toMatch(/export const DEALER_ECONOMICS_CAPABILITY/);
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/entitlements/batch")) return allowBatch();
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
        );
      }
      if (url.includes("/margin")) return jsonResponse([], 200);
      if (url.includes("/days")) return jsonResponse({}, 200);
      return jsonResponse({ detail: "not-mocked" }, 404);
    });
    render(<DealerVehicleEconomicsPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() => expect(screen.getByTestId("dealer-vehicle-ready")).toBeInTheDocument());
    expect(screen.queryByText(/RD\$\s*5,000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/D[ií]as en inventario:\s*37/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Margen:/i)).not.toBeInTheDocument();
  });
});
