/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerConexionesPage from "@/app/autos/dealer/conexiones/page";
import DealerDashboardPage from "@/app/autos/dealer/page";
import { tokenStorage } from "@/lib/auth/token-storage";
import {
  resetDealerAccessMemoryForTests,
  setDealerAccessContext,
} from "@/lib/dealer/access-context";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ isAuthenticated: true, role: "dealer" }),
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

function sponsorshipOk() {
  return jsonResponse(
    {
      sponsorships: [
        {
          subscription_id: "sub-1",
          beneficiary_unit_id: "ou-1",
          payer_tenant_id: "bank-tenant",
          inherits_to_children: true,
          starts_at: "2026-01-01T00:00:00Z",
          ends_at: null,
          status: "active",
          payer_name: "Banco X",
          payer_account_id: "must-not-render",
        },
      ],
    },
    200,
  );
}

describe("Dealer sponsorship surfaces", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
  });

  test("hub shows patrocinado por Banco X and never payer_account_id", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/sponsorship")) return sponsorshipOk();
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return jsonResponse({ results: {} }, 200);
      }
      if (url.includes("/api/v1/access/subscription")) {
        return jsonResponse({ has_subscription: false, subscription: null }, 200);
      }
      return jsonResponse({ detail: "not-mocked" }, 404);
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<DealerDashboardPage />, { wrapper: wrapperFor(client) });
    expect(await screen.findByText("patrocinado por Banco X")).toBeInTheDocument();
    expect(screen.queryByText(/must-not-render|payer_account_id/i)).not.toBeInTheDocument();
  });

  test("conexiones shows the same commercial copy", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/access/sponsorship")) return sponsorshipOk();
      return jsonResponse({ detail: "not-mocked" }, 404);
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<DealerConexionesPage />, { wrapper: wrapperFor(client) });
    expect(await screen.findByText("patrocinado por Banco X")).toBeInTheDocument();
    expect(screen.queryByText(/must-not-render/i)).not.toBeInTheDocument();
  });

  test("fail-closed: error hides the banner instead of inventing a bank", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ detail: { reason_code: "DEFAULT_DENY" } }, 403));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<DealerConexionesPage />, { wrapper: wrapperFor(client) });
    await waitFor(() => {
      expect(screen.queryByTestId("dealer-sponsorship-loading")).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId("dealer-sponsorship-ready")).not.toBeInTheDocument();
    expect(screen.queryByText(/patrocinado por/i)).not.toBeInTheDocument();
  });
});
