/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import DealerVehicleRegisterPage from "@/app/autos/dealer/inventario/[vehicleId]/registrar/page";
import { DEALER_REGISTER_CAPABILITY } from "@/lib/dealer/capabilities";
import { tokenStorage } from "@/lib/auth/token-storage";
import {
  resetDealerAccessMemoryForTests,
  setDealerAccessContext,
} from "@/lib/dealer/access-context";
import { acquisitionPayload, salePayload } from "@/lib/dealer/vehicle-economics-write";

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

function allowCreate() {
  return jsonResponse(
    {
      results: {
        [DEALER_REGISTER_CAPABILITY]: {
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

describe("vehicle economics POST forms", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
  });

  test("payload omits empty supplier_reference", () => {
    expect(
      acquisitionPayload({
        acquisition_mode_code: "auction",
        acquired_at: "2026-01-01T00:00:00",
        country_code: "DO",
        supplier_reference: null,
      }),
    ).toEqual({
      acquisition_mode_code: "auction",
      acquired_at: "2026-01-01T00:00:00",
      country_code: "DO",
    });
    expect(salePayload({ sale_price_amount: "10", currency: "DOP", sold_at: "2026-02-01T00:00:00" })).toEqual({
      sale_price_amount: "10",
      currency: "DOP",
      sold_at: "2026-02-01T00:00:00",
    });
  });

  test("READY posts sale to the live path and shows backend id", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/v1/access/entitlements/batch")) return allowCreate();
      if (url.includes("/api/v1/autos/vehicles/veh-1/sale") && init?.method === "POST") {
        return jsonResponse({ id: "sale-1" }, 200);
      }
      return jsonResponse({ detail: "not-mocked" }, 404);
    });
    render(<DealerVehicleRegisterPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    expect(await screen.findByTestId("dealer-register-ready")).toBeInTheDocument();
    await user.type(screen.getByLabelText("sale_price_amount"), "150000");
    await user.type(screen.getByLabelText("sale_currency"), "DOP");
    await user.type(screen.getByLabelText("sold_at"), "2026-03-01T12:00");
    await user.click(screen.getByRole("button", { name: "Registrar venta" }));
    expect(await screen.findByTestId("dealer-register-ack")).toHaveTextContent("sale sale-1");
    const saleCall = (global.fetch as jest.Mock).mock.calls.find((c) => String(c[0]).includes("/sale"));
    expect(saleCall[1].method).toBe("POST");
    expect(JSON.parse(saleCall[1].body)).toEqual({
      sale_price_amount: "150000",
      currency: "DOP",
      sold_at: "2026-03-01T12:00",
    });
  });

  test("BLOCKED when create capability is denied", async () => {
    global.fetch = jest.fn(async () =>
      jsonResponse(
        {
          results: {
            [DEALER_REGISTER_CAPABILITY]: {
              allowed: false,
              reason_code: "UPGRADE_REQUIRED",
              limit: null,
              current_usage: null,
            },
          },
        },
        200,
      ),
    );
    render(<DealerVehicleRegisterPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    expect(await screen.findByTestId("dealer-register-blocked")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar venta" })).not.toBeInTheDocument();
  });

  test("ERROR fail-closed on 409 POST", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/v1/access/entitlements/batch")) return allowCreate();
      if (url.includes("/sale") && init?.method === "POST") {
        return jsonResponse({ reason_code: "CONFLICT" }, 409);
      }
      return jsonResponse({ detail: "not-mocked" }, 404);
    });
    render(<DealerVehicleRegisterPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await screen.findByTestId("dealer-register-ready");
    await user.type(screen.getByLabelText("sale_price_amount"), "1");
    await user.type(screen.getByLabelText("sale_currency"), "DOP");
    await user.type(screen.getByLabelText("sold_at"), "2026-03-01T12:00");
    await user.click(screen.getByRole("button", { name: "Registrar venta" }));
    await waitFor(() => expect(screen.getByTestId("dealer-register-post-error")).toBeInTheDocument());
    expect(screen.getByTestId("dealer-register-post-error")).toHaveTextContent("CONFLICT");
  });
});
