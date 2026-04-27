import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useFeatureFlag } from "@/lib/credit-hub/hooks/useFeatureFlag";

jest.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ tenantId: "smoke-test" }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/dealer",
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function installFetchMock() {
  const fn = jest.fn();
  Object.defineProperty(global, "fetch", {
    value: fn,
    writable: true,
    configurable: true,
  });
  return jest.spyOn(global, "fetch");
}

function mockHealth(routeone_parity_enabled: boolean) {
  installFetchMock().mockResolvedValue(
    {
      status: 200,
      statusText: "OK",
      ok: true,
      clone: () => ({
        json: async () => ({
          status: "ok",
          routeone_parity_enabled,
          storage_mode: "memory",
          storage_status: "ok",
          webhook_status: "ok",
          tenant_probe: "smoke-test",
          timestamp: "2026-04-25T16:51:55.211925+00:00",
        }),
      }),
      json: async () => ({
        status: "ok",
        routeone_parity_enabled,
        storage_mode: "memory",
        storage_status: "ok",
        webhook_status: "ok",
        tenant_probe: "smoke-test",
        timestamp: "2026-04-25T16:51:55.211925+00:00",
      }),
    } as Response
  );
}

describe("useFeatureFlag", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  test("returns enabled=null while loading", () => {
    mockHealth(true);
    const { result } = renderHook(() => useFeatureFlag(), { wrapper });
    expect(result.current.enabled).toBeNull();
  });

  test("returns enabled=true when health.routeone_parity_enabled is true", async () => {
    mockHealth(true);
    const { result } = renderHook(() => useFeatureFlag(), { wrapper });

    await waitFor(() => expect(result.current.enabled).toBe(true));
  });

  test("returns enabled=false when health.routeone_parity_enabled is false", async () => {
    mockHealth(false);
    const { result } = renderHook(() => useFeatureFlag(), { wrapper });

    await waitFor(() => expect(result.current.enabled).toBe(false));
  });

  test("returns storageMode from health response", async () => {
    mockHealth(true);
    const { result } = renderHook(() => useFeatureFlag(), { wrapper });

    await waitFor(() => expect(result.current.storageMode).toBe("memory"));
  });
});
