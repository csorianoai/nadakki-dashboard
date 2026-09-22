/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { UsageMeter } from "@/components/dealer/UsageMeter";
import { CORE_NAV_CAPABILITY_KEYS } from "@/components/dealer/CoreNavigation";
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

function batchUsage(
  overrides: Record<string, { allowed: boolean; reason_code: string; limit: number | null; current_usage: number | null }>,
) {
  const results: Record<string, unknown> = {};
  for (const key of CORE_NAV_CAPABILITY_KEYS) {
    results[key] = overrides[key] ?? {
      allowed: false,
      reason_code: "DEFAULT_DENY",
      limit: null,
      current_usage: null,
    };
  }
  return { results };
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("UsageMeter", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    global.fetch = jest.fn();
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
  });

  test("displays usage metrics from canonical batch", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        batchUsage({
          "marketing.email.campaigns": {
            allowed: true,
            reason_code: "ALLOWED",
            limit: 10,
            current_usage: 7,
          },
          "legal.contracts.templates": {
            allowed: true,
            reason_code: "ALLOWED",
            limit: 20,
            current_usage: 5,
          },
        }),
        200,
      ),
    );

    render(<UsageMeter />, { wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })) });

    await waitFor(() => {
      expect(screen.getByText(/Marketing Email Campaigns/)).toBeInTheDocument();
      expect(screen.getByText("7/10")).toBeInTheDocument();
      expect(screen.getByText("5/20")).toBeInTheDocument();
    });
  });

  test("shows warning at 80% usage", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        batchUsage({
          "marketing.email.campaigns": {
            allowed: true,
            reason_code: "ALLOWED",
            limit: 10,
            current_usage: 8,
          },
        }),
        200,
      ),
    );

    render(<UsageMeter />, { wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })) });

    await waitFor(() => {
      expect(screen.getByText(/⚠️/)).toBeInTheDocument();
      expect(screen.getByText(/20% restante/)).toBeInTheDocument();
    });
  });

  test("handles unlimited capabilities", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        batchUsage({
          "credit.applications.submit": {
            allowed: true,
            reason_code: "ALLOWED",
            limit: null,
            current_usage: 100,
          },
        }),
        200,
      ),
    );

    render(<UsageMeter />, { wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })) });

    await waitFor(() => {
      expect(screen.getByText(/100\/∞/)).toBeInTheDocument();
    });
  });

  test("fail-closed on 403 does not keep usage", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ detail: { reason_code: "NO_ORGANIZATION_UNIT" } }, 403),
    );
    render(<UsageMeter />, { wrapper: wrapperFor(new QueryClient({ defaultOptions: { queries: { retry: false } } })) });
    await waitFor(() => {
      expect(screen.getByText(/Sin datos de uso este mes/)).toBeInTheDocument();
    });
  });
});
