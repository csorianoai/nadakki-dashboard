/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { CoreNavigation, CORE_NAV_CAPABILITY_KEYS } from "@/components/dealer/CoreNavigation";
import { ACCESS_ENDPOINTS } from "@/lib/access/client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { ERROR_401, ERROR_403, ERROR_501 } from "../lib/access/fixtures";
import { refreshAccessToken } from "@/lib/auth/token-refresh";
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

function batchOk(overrides: Record<string, { allowed: boolean; reason_code: string; limit?: number | null; current_usage?: number | null }>) {
  const results: Record<string, unknown> = {};
  for (const key of CORE_NAV_CAPABILITY_KEYS) {
    results[key] = overrides[key] ?? { allowed: false, reason_code: "DEFAULT_DENY", limit: null, current_usage: null };
  }
  return { results };
}

function seedDealer(tenantId: string, dealerId: string, organizationUnitId: string) {
  window.localStorage.setItem("nadakki_tenant_id", tenantId);
  setDealerAccessContext({ tenantId, dealerId, organizationUnitId });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("DASH-ACCESS-ADOPTION-01 CoreNavigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    (refreshAccessToken as jest.Mock).mockClear();
    global.fetch = jest.fn();
    seedDealer("tenant-a", "dealer-a", "ou-a");
  });

  test("T1 entitlements callsite uses canonical batch client", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(batchOk({
      "autos.inventory.view": { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null },
    }), 200));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(screen.getByTestId("core-navigation")).toBeInTheDocument());
    const url = String((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(url).toContain(ACCESS_ENDPOINTS.batch);
    expect(url).not.toContain("/api/v1/autos/entitlements");
  });

  test("T2 tenant A -> B forces a new read", async () => {
    const client = newClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(batchOk({
        "autos.inventory.view": { allowed: true, reason_code: "TENANT_A", limit: null, current_usage: null },
      }), 200))
      .mockResolvedValueOnce(jsonResponse(batchOk({
        "autos.inventory.view": { allowed: true, reason_code: "TENANT_B", limit: null, current_usage: null },
      }), 200));
    const { rerender } = render(<CoreNavigation />, { wrapper: wrapperFor(client) });
    await waitFor(() => expect(document.querySelector('[data-reason-code="TENANT_A"]')).toBeTruthy());
    seedDealer("tenant-b", "dealer-a", "ou-a");
    rerender(<CoreNavigation />);
    await waitFor(() => expect(document.querySelector('[data-reason-code="TENANT_B"]')).toBeTruthy());
    expect(document.querySelector('[data-reason-code="TENANT_A"]')).toBeNull();
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
  });

  test("T3 dealer A -> B does not reuse cache A", async () => {
    const client = newClient();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(batchOk({
        "autos.inventory.view": { allowed: true, reason_code: "DEALER_A", limit: null, current_usage: null },
      }), 200))
      .mockResolvedValueOnce(jsonResponse(batchOk({
        "autos.inventory.view": { allowed: true, reason_code: "DEALER_B", limit: null, current_usage: null },
      }), 200));
    const { rerender } = render(<CoreNavigation />, { wrapper: wrapperFor(client) });
    await waitFor(() => expect(document.querySelector('[data-reason-code="DEALER_A"]')).toBeTruthy());
    seedDealer("tenant-a", "dealer-b", "ou-a");
    rerender(<CoreNavigation />);
    await waitFor(() => expect(document.querySelector('[data-reason-code="DEALER_B"]')).toBeTruthy());
    expect(document.querySelector('[data-reason-code="DEALER_A"]')).toBeNull();
  });

  test("T4 403 at callsite does not logout", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({
      detail: { reason_code: "NO_ORGANIZATION_UNIT" },
    }, 403));
    const clearSpy = jest.spyOn(tokenStorage, "clearTokens");
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(document.querySelector('[data-reason-code="NO_ORGANIZATION_UNIT"]')).toBeTruthy());
    expect(screen.queryByText(/Available/)).not.toBeInTheDocument();
    expect(clearSpy).not.toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  test("T5 TARGET_CORE_NOT_READY is not allowed=true", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({
      detail: { reason_code: "TARGET_CORE_NOT_READY", capability: "credit.scoring.run" },
    }, 501));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(document.querySelector('[data-reason-code="TARGET_CORE_NOT_READY"]')).toBeTruthy());
    expect(document.querySelector('[data-allowed="true"]')).toBeNull();
    expect(screen.queryByText(/Available/)).not.toBeInTheDocument();
  });

  test("T7 absent tenant makes zero network calls", async () => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await Promise.resolve();
    await Promise.resolve();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  test("T8 tenant batch is not presented as dealer authorization", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(batchOk({
      "autos.inventory.view": { allowed: true, reason_code: "ALLOWED", limit: 10, current_usage: 7 },
    }), 200));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(screen.getByTestId("core-navigation")).toBeInTheDocument());
    const nav = screen.getByTestId("core-navigation");
    expect(nav).toHaveAttribute("data-access-scope", "tenant");
    expect(nav).toHaveAttribute("data-unit-scope", "UNIT_SCOPE_UNSUPPORTED");
    expect(nav).toHaveAttribute("data-dealer-authorized", "false");
    const dump = `${(global.fetch as jest.Mock).mock.calls[0][0]} ${JSON.stringify((global.fetch as jest.Mock).mock.calls[0][1]?.headers)}`;
    expect(dump).not.toMatch(/dealer_id/);
    expect(dump).not.toMatch(/organization_unit_id/);
    expect(screen.getByText(/7 \/ 10 used/)).toBeInTheDocument();
  });
});

/** REFETCH_TRIGGER=TEST_ONLY — no production invalidateQueries on access keys (hooks.ts:15-24). */
const RETRY_DELAY_MAX_MS = 30_000;

describe("T7-STATUS-CACHE-SAFETY", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    (refreshAccessToken as jest.Mock).mockClear();
    global.fetch = jest.fn();
    seedDealer("tenant-a", "dealer-a", "ou-a");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("T1 same key: 200 allowed then 403 fail-closed", async () => {
    const client = newClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        batchOk({
          "autos.inventory.view": { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null },
        }),
        200,
      ),
    );
    render(<CoreNavigation />, { wrapper: wrapperFor(client) });
    await waitFor(() => expect(document.querySelector('[data-allowed="true"]')).toBeTruthy());

    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_403, 403));
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["access"] });
    });
    await waitFor(() => {
      expect(document.querySelector('[data-allowed="true"]')).toBeNull();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  test("T2 same key: 200 allowed then 501 TARGET_CORE_NOT_READY fail-closed", async () => {
    const client = newClient();
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        batchOk({
          "autos.inventory.view": { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null },
        }),
        200,
      ),
    );
    render(<CoreNavigation />, { wrapper: wrapperFor(client) });
    await waitFor(() => expect(document.querySelector('[data-allowed="true"]')).toBeTruthy());

    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_501, 501));
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["access"] });
    });
    await waitFor(() => {
      expect(document.querySelector('[data-allowed="true"]')).toBeNull();
      expect(document.querySelector('[data-reason-code="TARGET_CORE_NOT_READY"]')).toBeTruthy();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  test("T3 403 does not call tokenStorage.clearTokens", async () => {
    const spy = jest.spyOn(tokenStorage, "clearTokens");
    spy.mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_403, 403));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(document.querySelector('[data-allowed="false"]')).toBeTruthy());
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test("T4a 403 exactly 1 request past retryDelay max", async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(ERROR_403, 403));
    render(<CoreNavigation />, { wrapper: wrapperFor(new QueryClient()) });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(RETRY_DELAY_MAX_MS + 1_000);
    });
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
  });

  test("T4b 501 exactly 1 request past retryDelay max", async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(ERROR_501, 501));
    render(<CoreNavigation />, { wrapper: wrapperFor(new QueryClient()) });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(RETRY_DELAY_MAX_MS + 1_000);
    });
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
  });

  test("T8 RACE_NOT_REACHABLE_BY_PRODUCTION_MECHANISM", () => {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const hooksSrc = fs.readFileSync(path.join(process.cwd(), "lib/access/hooks.ts"), "utf8");
    const navSrc = fs.readFileSync(path.join(process.cwd(), "components/dealer/CoreNavigation.tsx"), "utf8");
    expect(hooksSrc).toMatch(/queryFn: \(\) => fetchEntitlementsBatch/);
    expect(hooksSrc).not.toMatch(/signal/);
    expect(hooksSrc).toMatch(/staleTime: 60_000/);
    expect(hooksSrc).toMatch(/refetchOnWindowFocus: false/);
    expect(hooksSrc).not.toMatch(/refetchInterval/);
    expect(navSrc).not.toMatch(/invalidateQueries/);
  });
});

/**
 * 401 AUTH_REQUIRED — autos_core_access_router.py:50 BACKEND_SHA 014c82301be44a9ce4e681eba9fcf72d89a7f03b
 * 403 NO_ORGANIZATION_UNIT — autos_bridges.py:118-120 same SHA (batch 200 does not emit HTTP 403)
 * 409 string detail — autos_core_access_router.py:276-278 (no reason_code field)
 * 422 FastAPI RequestValidationError — not an explicit router branch
 */
const HTTP_409_NATIVE = { detail: "Tenant already has an active subscription" };
const HTTP_422_FASTAPI = {
  detail: [{ loc: ["query", "capabilities"], msg: "value is not a valid string", type: "type_error.str" }],
};

describe("DASH-ACCESS-ERROR-UX-01", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    (refreshAccessToken as jest.Mock).mockClear();
    global.fetch = jest.fn();
    seedDealer("tenant-a", "dealer-a", "ou-a");
  });

  test("T1 401 surfaces auth failure and uses refreshAccessToken", async () => {
    const spy = jest.spyOn(tokenStorage, "clearTokens");
    spy.mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_401, 401));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(document.querySelector('[data-access-error="auth"]')).toBeTruthy());
    expect(document.querySelector('[data-http-status="401"]')).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/AUTH_REQUIRED/);
    expect(refreshAccessToken).toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
    expect(document.querySelector('[data-allowed="true"]')).toBeNull();
    spy.mockRestore();
  });

  test("T2 403 fail-closed without logout", async () => {
    const spy = jest.spyOn(tokenStorage, "clearTokens");
    spy.mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_403, 403));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(document.querySelector('[data-access-error="denied"]')).toBeTruthy());
    expect(document.querySelector('[data-http-status="403"]')).toBeTruthy();
    expect(document.querySelector('[data-reason-code="NO_ORGANIZATION_UNIT"]')).toBeTruthy();
    expect(document.querySelector('[data-access-error="auth"]')).toBeNull();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test("T3 409 conflict preserves parser reason_code and does not logout", async () => {
    const spy = jest.spyOn(tokenStorage, "clearTokens");
    spy.mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(HTTP_409_NATIVE, 409));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(document.querySelector('[data-access-error="conflict"]')).toBeTruthy());
    const banner = document.querySelector('[data-access-error="conflict"]');
    expect(banner).toHaveAttribute("data-http-status", "409");
    expect(banner).toHaveAttribute("data-reason-code", "");
    expect(screen.getByRole("alert").textContent).toContain("Tenant already has an active subscription");
    expect(document.querySelector('[data-access-error="denied"]')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test("T4 422 validation is not deny or auth and does not logout", async () => {
    const spy = jest.spyOn(tokenStorage, "clearTokens");
    spy.mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(HTTP_422_FASTAPI, 422));
    render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
    await waitFor(() => expect(document.querySelector('[data-access-error="validation"]')).toBeTruthy());
    const banner = document.querySelector('[data-access-error="validation"]');
    expect(banner).toHaveAttribute("data-http-status", "422");
    expect(banner).toHaveAttribute("data-reason-code", "");
    expect(screen.getByRole("alert").textContent).toMatch(/Validation error/);
    expect(document.querySelector('[data-access-error="denied"]')).toBeNull();
    expect(document.querySelector('[data-access-error="auth"]')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test("T5 403/409/422 never set data-allowed=true", async () => {
    const cases: Array<[unknown, number]> = [
      [ERROR_403, 403],
      [HTTP_409_NATIVE, 409],
      [HTTP_422_FASTAPI, 422],
    ];
    for (const [body, status] of cases) {
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(body, status));
      const { unmount } = render(<CoreNavigation />, { wrapper: wrapperFor(newClient()) });
      await waitFor(() => expect(screen.queryByText(/Cargando capacidades/)).not.toBeInTheDocument());
      expect(document.querySelector('[data-allowed="true"]')).toBeNull();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      unmount();
    }
  });

  test("T6 no second error parser outside lib/access", () => {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const navSrc = fs.readFileSync(path.join(process.cwd(), "components/dealer/CoreNavigation.tsx"), "utf8");
    const hubSrc = fs.readFileSync(path.join(process.cwd(), "app/autos/dealer/page.tsx"), "utf8");
    for (const src of [navSrc, hubSrc]) {
      expect(src).not.toMatch(/extractCreditHubReasonCode/);
      expect(src).not.toMatch(/detail\?\.reason_code/);
      expect(src).not.toMatch(/function\s+\w*[Pp]arse\w*[Rr]eason/);
    }
    expect(navSrc).toMatch(/query\.error\.reason_code/);
  });
});


