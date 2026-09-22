/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerDashboardPage from "@/app/autos/dealer/page";
import { CORE_NAV_CAPABILITY_KEYS, DEALER_QUICK_LINK_CAPABILITIES } from "@/components/dealer/CoreNavigation";
import { tokenStorage } from "@/lib/auth/token-storage";
import { ERROR_403, ERROR_501 } from "../lib/access/fixtures";
import {
  resetDealerAccessMemoryForTests,
  setDealerAccessContext,
} from "@/lib/dealer/access-context";

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ isAuthenticated: true, role: "dealer" }),
}));

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const PRIVILEGED_HREFS = Object.keys(DEALER_QUICK_LINK_CAPABILITIES);

function jsonResponse(body: unknown, status: number) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function batchOk(
  overrides: Record<
    string,
    { allowed: boolean; reason_code: string; limit?: number | null; current_usage?: number | null }
  >,
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

function seedDealer() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function privilegedQuickLinks() {
  const section = screen.getByTestId("dealer-quick-links");
  return Array.from(section.querySelectorAll('[data-testid="privileged-quick-link"]'));
}

describe("Dealer hub page privileged quick links", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    global.fetch = jest.fn();
    seedDealer();
  });

  test("T7 403 => cero quick links privilegiados", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_403, 403));
    render(<DealerDashboardPage />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(screen.getByTestId("dealer-quick-links")).toHaveAttribute("data-fail-closed", "true"));
    expect(privilegedQuickLinks()).toHaveLength(0);
    for (const href of PRIVILEGED_HREFS) {
      expect(screen.getByTestId("dealer-quick-links").querySelector(`a[href="${href}"]`)).toBeNull();
    }
  });

  test("T8 409 => cero quick links privilegiados", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ detail: "Tenant already has an active subscription" }, 409),
    );
    render(<DealerDashboardPage />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(screen.getByTestId("dealer-quick-links")).toHaveAttribute("data-fail-closed", "true"));
    expect(privilegedQuickLinks()).toHaveLength(0);
  });

  test("T9 422 => cero quick links privilegiados", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        { detail: [{ loc: ["query"], msg: "invalid", type: "type_error.str" }] },
        422,
      ),
    );
    render(<DealerDashboardPage />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(screen.getByTestId("dealer-quick-links")).toHaveAttribute("data-fail-closed", "true"));
    expect(privilegedQuickLinks()).toHaveLength(0);
  });

  test("T10 501 => cero quick links privilegiados", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_501, 501));
    render(<DealerDashboardPage />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(screen.getByTestId("dealer-quick-links")).toHaveAttribute("data-fail-closed", "true"));
    expect(privilegedQuickLinks()).toHaveLength(0);
  });

  test("missing entitlement result => corresponding privileged link absent", async () => {
    const results: Record<string, unknown> = {};
    for (const key of CORE_NAV_CAPABILITY_KEYS) {
      if (key === "autos.inventory.list") continue;
      results[key] = {
        allowed: true,
        reason_code: "ALLOWED",
        limit: null,
        current_usage: null,
      };
    }
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ results }, 200));
    render(<DealerDashboardPage />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(screen.getByTestId("dealer-quick-links")).toHaveAttribute("data-fail-closed", "false"));
    const section = screen.getByTestId("dealer-quick-links");
    expect(section.querySelector('a[href="/autos/dealer/publicar-rapido"]')).toBeNull();
    expect(section.querySelector('a[href="/autos/dealer/leads"]')).not.toBeNull();
  });

  test("T11 allowed=false por capability => quick link correspondiente ausente", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        batchOk({
          "autos.inventory.list": { allowed: false, reason_code: "DEFAULT_DENY" },
          "autos.leads.crm": { allowed: true, reason_code: "ALLOWED" },
          "autos.analytics.basic": { allowed: false, reason_code: "UPGRADE_REQUIRED" },
        }),
        200,
      ),
    );
    render(<DealerDashboardPage />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(screen.getByTestId("dealer-quick-links")).toHaveAttribute("data-fail-closed", "false"));
    const section = screen.getByTestId("dealer-quick-links");
    expect(section.querySelector('a[href="/autos/dealer/publicar-rapido"]')).toBeNull();
    expect(section.querySelector('a[href="/autos/dealer/leads"]')).not.toBeNull();
    expect(section.querySelector('a[href="/autos/dealer/insights"]')).toBeNull();
  });

  test("T12 allowed=true => quick link correspondiente disponible", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        batchOk({
          "autos.inventory.list": { allowed: true, reason_code: "ALLOWED" },
          "autos.leads.crm": { allowed: true, reason_code: "ALLOWED" },
          "autos.analytics.basic": { allowed: true, reason_code: "ALLOWED" },
        }),
        200,
      ),
    );
    render(<DealerDashboardPage />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(privilegedQuickLinks().length).toBe(3));
    const section = screen.getByTestId("dealer-quick-links");
    expect(section.querySelector('a[href="/autos/dealer/publicar-rapido"]')).not.toBeNull();
    expect(section.querySelector('a[href="/autos/dealer/leads"]')).not.toBeNull();
    expect(section.querySelector('a[href="/autos/dealer/insights"]')).not.toBeNull();
  });

  test("M8 no stale allowed after 403", async () => {
    const client = newClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        batchOk({
          "autos.inventory.list": { allowed: true, reason_code: "ALLOWED" },
          "autos.leads.crm": { allowed: true, reason_code: "ALLOWED" },
          "autos.analytics.basic": { allowed: true, reason_code: "ALLOWED" },
        }),
        200,
      ),
    );
    render(<DealerDashboardPage />, { wrapper: wrapperFor(client) });
    await waitFor(() => expect(privilegedQuickLinks().length).toBe(3));
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_403, 403));
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["access"] });
    });
    await waitFor(() => {
      expect(screen.getByTestId("dealer-quick-links")).toHaveAttribute("data-fail-closed", "true");
      expect(privilegedQuickLinks()).toHaveLength(0);
    });
  });
});
