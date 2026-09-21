/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import DealerDashboardPage from "@/app/autos/dealer/page";
import { UpgradeModal, parseAccessPlan } from "@/components/dealer/UpgradeModal";
import { CORE_NAV_CAPABILITY_KEYS } from "@/components/dealer/CoreNavigation";
import { tokenStorage } from "@/lib/auth/token-storage";
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

function jsonResponse(body: unknown, status: number) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function batchOk() {
  const results: Record<string, unknown> = {};
  for (const key of CORE_NAV_CAPABILITY_KEYS) {
    results[key] = { allowed: false, reason_code: "DEFAULT_DENY", limit: null, current_usage: null };
  }
  return { results };
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function seedDealer() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
}

describe("parseAccessPlan", () => {
  test("keeps backend slug, name, price_rd, billing_period, enabled keys", () => {
    const parsed = parseAccessPlan({
      slug: "crece",
      name: "Crece",
      price_rd: 10030,
      billing_period: "month",
      current_version: {
        version: 1,
        capabilities: [
          { key: "marketing.campaigns.create", enabled: true, limit: 5 },
          { key: "legal.quick_check", enabled: false, limit: null },
        ],
      },
    });
    expect(parsed).toEqual({
      slug: "crece",
      name: "Crece",
      price_rd: 10030,
      billing_period: "month",
      capability_keys: ["marketing.campaigns.create"],
    });
  });

  test("drops rows without slug/name and does not invent price", () => {
    expect(parseAccessPlan({ name: "Crece", price_rd: 1 })).toBeNull();
    expect(parseAccessPlan({ slug: "crece", name: "Crece" })?.price_rd).toBeNull();
  });
});

describe("UpgradeModal catalog", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    global.fetch = jest.fn();
    seedDealer();
  });

  test("renders only payload name and price_rd", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        {
          plans: [
            {
              slug: "crece",
              name: "Crece Live",
              price_rd: 8888,
              billing_period: "month",
              current_version: { version: 1, capabilities: [{ key: "autos.leads.view", enabled: true }] },
            },
          ],
        },
        200,
      ),
    );
    render(
      <UpgradeModal decision={{ allowed: false, reason_code: "UPGRADE_REQUIRED" }} onClose={() => undefined} />,
      { wrapper: wrapperFor(newClient()) },
    );
    await waitFor(() => expect(screen.getByText("Crece Live")).toBeInTheDocument());
    expect(screen.getByTestId("dealer-upgrade-price")).toHaveTextContent("8,888 / month");
    expect(screen.getByText("autos.leads.view")).toBeInTheDocument();
    expect(screen.queryByText(/RD\$4,130/)).not.toBeInTheDocument();
    expect(screen.queryByText(/RD\$10,030/)).not.toBeInTheDocument();
    expect(screen.queryByText(/RD\$17,464/)).not.toBeInTheDocument();
  });

  test("fail-closed on 403 — no fake plans", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ detail: { reason_code: "NO_ORGANIZATION_UNIT" } }, 403),
    );
    render(
      <UpgradeModal decision={{ allowed: false, reason_code: "UPGRADE_REQUIRED" }} onClose={() => undefined} />,
      { wrapper: wrapperFor(newClient()) },
    );
    await waitFor(() => expect(screen.getByTestId("dealer-upgrade-fail-closed")).toBeInTheDocument());
    expect(screen.queryByTestId("dealer-upgrade-plans")).not.toBeInTheDocument();
    expect(screen.queryByText(/RD\$4,130/)).not.toBeInTheDocument();
  });

  test("empty plans array fail-closed", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ plans: [] }, 200));
    render(
      <UpgradeModal decision={{ allowed: false, reason_code: "UPGRADE_REQUIRED" }} onClose={() => undefined} />,
      { wrapper: wrapperFor(newClient()) },
    );
    await waitFor(() => expect(screen.getByTestId("dealer-upgrade-fail-closed")).toBeInTheDocument());
    expect(screen.queryByTestId("dealer-upgrade-plan")).not.toBeInTheDocument();
  });

  test("omits price when price_rd is absent", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ plans: [{ slug: "conecta", name: "Conecta" }] }, 200),
    );
    render(
      <UpgradeModal decision={{ allowed: false, reason_code: "UPGRADE_REQUIRED" }} onClose={() => undefined} />,
      { wrapper: wrapperFor(newClient()) },
    );
    await waitFor(() => expect(screen.getByText("Conecta")).toBeInTheDocument());
    expect(screen.queryByTestId("dealer-upgrade-price")).not.toBeInTheDocument();
  });
});

describe("Dealer Hub upgrade CTA", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    global.fetch = jest.fn();
    seedDealer();
  });

  test("CTA opens modal against /api/v1/access/plans", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (String(url).includes("/api/v1/access/plans")) {
        return Promise.resolve(
          jsonResponse({ plans: [{ slug: "domina", name: "Domina Live", price_rd: 12 }] }, 200),
        );
      }
      return Promise.resolve(jsonResponse(batchOk(), 200));
    });
    render(<DealerDashboardPage />, { wrapper: wrapperFor(newClient()) });
    await user.click(screen.getByTestId("dealer-upgrade-cta"));
    await waitFor(() => expect(screen.getByText("Domina Live")).toBeInTheDocument());
    expect((global.fetch as jest.Mock).mock.calls.some((call) => String(call[0]).includes("/api/v1/access/plans"))).toBe(
      true,
    );
  });
});
