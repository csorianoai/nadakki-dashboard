/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  ACCESS_ENDPOINTS,
  ACCESS_SCOPE_TENANT,
  ACCESS_UNIT_SCOPE_INCLUDED,
  ACCESS_UNIT_SCOPE_OMITTED,
  AccessApiError,
  AccessTenantRequiredError,
  accessQueryKey,
  fetchEntitlementsBatch,
  getAccessClientContext,
  shouldRetryAccessQuery,
} from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { tokenStorage } from "@/lib/auth/token-storage";
import { refreshAccessToken } from "@/lib/auth/token-refresh";
import {
  resetDealerAccessMemoryForTests,
  setDealerAccessContext,
} from "@/lib/dealer/access-context";
import { BATCH_200, ERROR_401, ERROR_403, ERROR_409, ERROR_422, ERROR_501 } from "./fixtures";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

function jsonResponse(body: unknown, status: number) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function fetchDump() {
  const call = (global.fetch as jest.Mock).mock.calls[0];
  return `${call[0]} ${JSON.stringify(call[1]?.headers)} ${String(call[1]?.body ?? "")}`;
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

async function expectAccessError(
  run: () => Promise<unknown>,
  status: number,
  reason_code?: string | null,
) {
  try {
    await run();
    throw new Error("expected AccessApiError");
  } catch (error) {
    expect(error).toBeInstanceOf(AccessApiError);
    const accessError = error as AccessApiError;
    expect(accessError.status).toBe(status);
    if (reason_code !== undefined) expect(accessError.reason_code).toBe(reason_code);
    return accessError;
  }
}

describe("DASH-ACCESS-CLIENT-01", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    (refreshAccessToken as jest.Mock).mockClear();
    global.fetch = jest.fn();
    seedDealer("tenant-a", "dealer-a", "ou-a");
  });

  test("T1 200 BATCH preserves full payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(BATCH_200, 200));
    const result = await fetchEntitlementsBatch(["autos.inventory.view", "credit.scoring.run"]);
    expect(result.results).toEqual(BATCH_200.results);
    expect(result).toEqual({ ...BATCH_200, scope: ACCESS_SCOPE_TENANT, unitScope: ACCESS_UNIT_SCOPE_INCLUDED });
  });

  test("T2 401 keeps status and triggers existing session refresh", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_401, 401));
    const clearSpy = jest.spyOn(tokenStorage, "clearTokens");
    const error = await expectAccessError(() => fetchEntitlementsBatch(["autos.inventory.view"]), 401, null);
    expect(error.detail).toBe("AUTH_REQUIRED");
    expect(refreshAccessToken).toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  test("T3 403 keeps reason_code and does not logout", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_403, 403));
    const clearSpy = jest.spyOn(tokenStorage, "clearTokens");
    await expectAccessError(() => fetchEntitlementsBatch(["autos.inventory.view"]), 403, "NO_ORGANIZATION_UNIT");
    expect(clearSpy).not.toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  test("T4 409 keeps reason_code", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_409, 409));
    await expectAccessError(() => fetchEntitlementsBatch(["autos.inventory.view"]), 409, "SUBSCRIPTION_EXISTS");
  });

  test("T5 422 keeps reason_code", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_422, 422));
    await expectAccessError(() => fetchEntitlementsBatch(["autos.inventory.view"]), 422, "VALIDATION_ERROR");
  });

  test("T6 501 TARGET_CORE_NOT_READY", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(ERROR_501, 501));
    await expectAccessError(() => fetchEntitlementsBatch(["credit.scoring.run"]), 501, "TARGET_CORE_NOT_READY");
  });

  test("T7 403 and 501 are not retried (one network call each)", async () => {
    const defaults = { defaultOptions: { queries: { retry: 1, retryDelay: 0 } } };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(ERROR_403, 403))
      .mockResolvedValueOnce(jsonResponse(ERROR_501, 501));
    const { result: first } = renderHook(() => useAccessEntitlementsBatch(["autos.inventory.view"]), {
      wrapper: wrapperFor(new QueryClient(defaults)),
    });
    await waitFor(() => expect(first.current.isError).toBe(true));
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
    expect((first.current.error as AccessApiError).status).toBe(403);

    const { result: second } = renderHook(() => useAccessEntitlementsBatch(["credit.scoring.run"]), {
      wrapper: wrapperFor(new QueryClient(defaults)),
    });
    await waitFor(() => expect(second.current.isError).toBe(true));
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
    expect((second.current.error as AccessApiError).status).toBe(501);
    expect(shouldRetryAccessQuery(0, second.current.error)).toBe(false);
  });

  test("T8 tenant from current context; absent tenant makes zero calls", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(BATCH_200, 200));
    await fetchEntitlementsBatch(["autos.inventory.view"]);
    expect(new Headers((global.fetch as jest.Mock).mock.calls[0][1].headers).get("X-Tenant-ID")).toBe("tenant-a");
    (global.fetch as jest.Mock).mockClear();
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    await expect(fetchEntitlementsBatch(["autos.inventory.view"])).rejects.toBeInstanceOf(AccessTenantRequiredError);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("T9 dealer cache isolation", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({ results: { cap: { allowed: true, reason_code: "A", limit: null, current_usage: null } } }, 200))
      .mockResolvedValueOnce(jsonResponse({ results: { cap: { allowed: false, reason_code: "B", limit: null, current_usage: null } } }, 200));
    const { result, rerender } = renderHook(() => useAccessEntitlementsBatch(["cap"]), { wrapper: wrapperFor(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.results.cap.reason_code).toBe("A");
    seedDealer("tenant-a", "dealer-b", "ou-b");
    rerender();
    await waitFor(() => expect(result.current.data?.results.cap.reason_code).toBe("B"));
    expect(result.current.data?.results.cap.reason_code).not.toBe("A");
    expect(accessQueryKey(ACCESS_ENDPOINTS.batch, getAccessClientContext())).toEqual([
      "access", ACCESS_ENDPOINTS.batch, "tenant-a", "dealer-b", "ou-b",
    ]);
  });

  test("T10 no fabricated dealer_id without dealer context", async () => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ ...BATCH_200, organization_unit_id: null }, 200),
    );
    const omitted = await fetchEntitlementsBatch(["autos.inventory.view"]);
    expect(fetchDump()).not.toMatch(/dealer_id/);
    expect(fetchDump()).not.toMatch(/organization_unit_id=/);
    expect(omitted.organization_unit_id).toBeNull();
    expect(omitted.unitScope).toBe(ACCESS_UNIT_SCOPE_OMITTED);
  });

  test("T11 batch sends organization_unit_id from context; never dealer_id", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(BATCH_200, 200));
    const result = await fetchEntitlementsBatch(["autos.inventory.view"]);
    expect(fetchDump()).toMatch(/organization_unit_id=ou-a/);
    expect(fetchDump()).not.toMatch(/dealer_id/);
    expect(result.scope).toBe("tenant");
    expect(result.organization_unit_id).toBe("ou-a");
    expect(result.unitScope).toBe(ACCESS_UNIT_SCOPE_INCLUDED);
  });

  test("T11b unitScope follows backend echo, not the query we sent", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ ...BATCH_200, organization_unit_id: null }, 200),
    );
    const result = await fetchEntitlementsBatch(["autos.inventory.view"]);
    expect(fetchDump()).toMatch(/organization_unit_id=ou-a/);
    expect(result.organization_unit_id).toBeNull();
    expect(result.unitScope).toBe(ACCESS_UNIT_SCOPE_OMITTED);
  });

  test("T12 tenant cache isolation", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({ results: { cap: { allowed: true, reason_code: "TENANT_A", limit: null, current_usage: null } } }, 200))
      .mockResolvedValueOnce(jsonResponse({ results: { cap: { allowed: true, reason_code: "TENANT_B", limit: null, current_usage: null } } }, 200));
    const { result, rerender } = renderHook(() => useAccessEntitlementsBatch(["cap"]), { wrapper: wrapperFor(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keyA = accessQueryKey(ACCESS_ENDPOINTS.batch, getAccessClientContext());
    expect(result.current.data?.results.cap.reason_code).toBe("TENANT_A");
    seedDealer("tenant-b", "dealer-a", "ou-a");
    expect(accessQueryKey(ACCESS_ENDPOINTS.batch, getAccessClientContext())).not.toEqual(keyA);
    rerender();
    await waitFor(() => expect(result.current.data?.results.cap.reason_code).toBe("TENANT_B"));
    expect(result.current.data?.results.cap.reason_code).not.toBe("TENANT_A");
  });
});
