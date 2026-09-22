/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerCoreStatusPage from "@/app/autos/dealer/estado/page";
import { DEALER_CORE_STATUS_ROWS } from "@/lib/dealer/core-status";
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

  test("state from readinessKey; CTA from actionCapability; batch omits readiness keys", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/readiness")) {
        return jsonResponse(
          {
            entries: [
              {
                capability_key: "credit.applications.view",
                status: "LIVE",
                is_usable: true,
                version: "1",
                notes: null,
              },
              {
                capability_key: "legal.cases.view",
                status: "PENDING_EXTERNAL_ACTIVATION",
                is_usable: false,
                version: null,
                notes: "Proveedor legal pendiente",
              },
              {
                capability_key: "marketing.social.publish",
                status: "LIVE",
                is_usable: true,
                version: "1",
                notes: null,
              },
              {
                capability_key: "accounting.invoices.view",
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
              "credit.applications.submit": {
                allowed: true,
                reason_code: "ALLOWED",
                limit: null,
                current_usage: null,
              },
              "legal.cases.create": {
                allowed: true,
                reason_code: "ALLOWED",
                limit: null,
                current_usage: null,
              },
              "marketing.ads.manage": {
                allowed: false,
                reason_code: "UPGRADE_REQUIRED",
                limit: null,
                current_usage: null,
              },
              "accounting.invoices.create": {
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
    expect(byName["Dealer-Bank"]).toHaveAttribute("data-readiness-key", "credit.applications.view");
    expect(byName["Dealer-Bank"]).toHaveAttribute("data-action-capability", "credit.applications.submit");
    expect(byName.Legal).toHaveAttribute("data-core-state", "NOT_READY");
    expect(byName.Marketing).toHaveAttribute("data-core-state", "READY");
    expect(byName.Contable).toHaveAttribute("data-core-state", "BLOCKED");
    expect(screen.getByRole("link", { name: /Abrir/ })).toHaveAttribute("href", "/credit-hub/dealer");
    expect(screen.getByRole("button", { name: /Ver planes publicados/ })).toBeInTheDocument();

    const batchUrl = (global.fetch as jest.Mock).mock.calls
      .map((c) => String(c[0]))
      .find((u) => u.includes("/api/v1/access/entitlements/batch"));
    expect(batchUrl).toBeTruthy();
    for (const row of DEALER_CORE_STATUS_ROWS) {
      expect(batchUrl).toContain(row.actionCapability);
      expect(batchUrl).not.toContain(`capabilities=${row.readinessKey}`);
      expect(batchUrl?.includes(row.readinessKey)).toBe(false);
    }
  });
});
