/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerCoreStatusPage from "@/app/autos/dealer/estado/page";
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

describe("Dealer core status home", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
  });

  test("shows READY only for usable+allowed cores and NOT_READY when pending", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/readiness")) {
        return jsonResponse(
          {
            entries: [
              {
                capability_key: "credit.applications.create",
                status: "LIVE",
                is_usable: true,
                version: "1",
                notes: null,
              },
              {
                capability_key: "legal.quick_check",
                status: "PENDING_EXTERNAL_ACTIVATION",
                is_usable: false,
                version: null,
                notes: "Proveedor legal pendiente",
              },
              {
                capability_key: "marketing.campaigns.create",
                status: "LIVE",
                is_usable: true,
                version: "1",
                notes: null,
              },
              {
                capability_key: "accounting.commissions.view",
                status: "BLOCKED",
                is_usable: false,
                version: null,
                notes: "Contable bloqueado",
              },
            ],
            summary: {},
            total: 4,
          },
          200,
        ) as Response;
      }
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return jsonResponse(
          {
            results: {
              "credit.applications.create": {
                allowed: true,
                reason_code: "ALLOWED",
                limit: null,
                current_usage: null,
              },
              "legal.quick_check": {
                allowed: false,
                reason_code: "TARGET_CORE_NOT_READY",
                limit: null,
                current_usage: null,
              },
              "marketing.campaigns.create": {
                allowed: false,
                reason_code: "UPGRADE_REQUIRED",
                limit: null,
                current_usage: null,
              },
              "accounting.commissions.view": {
                allowed: false,
                reason_code: "DEFAULT_DENY",
                limit: null,
                current_usage: null,
              },
            },
          },
          200,
        ) as Response;
      }
      return jsonResponse({}, 404) as Response;
    });

    render(<DealerCoreStatusPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });

    await waitFor(() => expect(screen.getByTestId("dealer-core-status-ready")).toBeInTheDocument());
    const cards = screen.getAllByTestId("dealer-core-card");
    const byName = Object.fromEntries(cards.map((el) => [el.getAttribute("data-core-name"), el]));
    expect(byName["Dealer-Bank"]).toHaveAttribute("data-core-state", "READY");
    expect(byName.Legal).toHaveAttribute("data-core-state", "NOT_READY");
    expect(byName.Marketing).toHaveAttribute("data-core-state", "BLOCKED");
    expect(byName.Contable).toHaveAttribute("data-core-state", "BLOCKED");
    expect(screen.getByRole("link", { name: /Abrir/ })).toHaveAttribute("href", "/credit-hub/dealer");
    expect(screen.queryByRole("link", { name: /Abrir/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ver planes publicados/ })).toBeInTheDocument();
  });
});
