/**
 * Los modulos del tenant se piden con apiFetch (Bearer + renovacion en 401), no con fetch plano.
 * El backend (#2667) ya exige sesion y tenant propio en GET /api/v1/tenants/{id}/modules: antes la ruta era abierta y el hook
 * mandaba solo X-Tenant-ID; con el cierre, un fetch plano daba 401, `modules` quedaba vacio y ModuleGate/ForgeAppSidebar
 * ocultaban todos los modulos a cualquier usuario que no fuera superadmin.
 */
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/contexts/TenantContext", () => ({ useTenant: jest.fn() }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));

import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTenantModules } from "@/hooks/useTenantModules";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";

const apiFetchMock = () => jest.requireMock("@/lib/api/fetch-client").apiFetch as jest.Mock;
const resp = (cuerpo: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(cuerpo) } as Response);

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  apiFetchMock().mockReset();
  (useTenant as jest.Mock).mockReturnValue({ tenantId: "11111111-1111-4111-8111-111111111111" });
  (useAuth as jest.Mock).mockReturnValue({ activeRole: { role_key: "tenant_admin" } });
  global.fetch = jest.fn(() => {
    throw new Error("el hook no debe usar fetch plano (sin Authorization)");
  }) as unknown as typeof fetch;
});

describe("useTenantModules", () => {
  it("pide los modulos con apiFetch y no con fetch plano", async () => {
    apiFetchMock().mockImplementation(() =>
      resp({ tenant_id: "t", plan: "pro", modules: [{ slug: "credit", label: "Credit", enabled: true }] }),
    );
    const { result } = renderHook(() => useTenantModules(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiFetchMock()).toHaveBeenCalledTimes(1);
    expect(apiFetchMock().mock.calls[0][0]).toBe("/api/v1/tenants/11111111-1111-4111-8111-111111111111/modules");
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.hasModule("credit")).toBe(true);
  });

  it("con 401 deja error y ningun modulo (la causa de ocultar el menu si faltara la sesion)", async () => {
    apiFetchMock().mockImplementation(() => resp({ detail: "missing_auth" }, 401));
    const { result } = renderHook(() => useTenantModules(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.modules).toEqual([]);
    expect(result.current.hasModule("credit")).toBe(false);
  });
});
