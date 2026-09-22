/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerConexionesPage from "@/app/autos/dealer/conexiones/page";
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

describe("Dealer conexiones surface", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    seedDealer();
  });

  test("READY renders only platforms returned by GET /api/social/connections", async () => {
    routeFetch((url) => {
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return {
          status: 200,
          body: {
            results: {
              "marketing.social.publish": {
                allowed: true,
                reason_code: "ALLOWED",
                limit: null,
                current_usage: null,
              },
            },
          },
        };
      }
      if (url.includes("/api/social/connections")) {
        return {
          status: 200,
          body: { connections: [{ platform: "facebook", connected: true, account: "@patio-naco" }] },
        };
      }
      return { status: 404, body: {} };
    });
    render(<DealerConexionesPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() => expect(screen.getByTestId("dealer-connections-ready")).toBeInTheDocument());
    expect(screen.getByText("facebook")).toBeInTheDocument();
    expect(screen.getByText("@patio-naco")).toBeInTheDocument();
    expect(screen.queryByText(/instagram/i)).not.toBeInTheDocument();
  });

  test("BLOCKED does not call social connections", async () => {
    routeFetch((url) => {
      if (url.includes("/api/v1/access/entitlements/batch")) {
        return {
          status: 200,
          body: {
            results: {
              "marketing.social.publish": {
                allowed: false,
                reason_code: "TARGET_CORE_NOT_READY",
                limit: null,
                current_usage: null,
              },
            },
          },
        };
      }
      return { status: 500, body: {} };
    });
    render(<DealerConexionesPage />, {
      wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    });
    await waitFor(() => expect(screen.getByTestId("dealer-reason-panel")).toBeInTheDocument());
    expect(screen.getByTestId("dealer-reason-panel")).toHaveAttribute(
      "data-reason-code",
      "TARGET_CORE_NOT_READY",
    );
    expect(screen.getByText(/El core aún no está habilitado/)).toBeInTheDocument();
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/api/social/connections"))).toBe(false);
  });
});
