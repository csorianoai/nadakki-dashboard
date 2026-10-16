/** PS-2 parte 1: fijarContexto de useAuth (POST /auth/contexto) guarda los tokens y actualiza tenant/roles. */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { useAuth } from "@/hooks/useAuth";
import { tokenStorage } from "@/lib/auth/token-storage";
import { fijarContextoV2, getMeV2, refreshTokenV2 } from "@/lib/api/auth-v2";

jest.mock("@/lib/api/auth-v2", () => ({
  refreshTokenV2: jest.fn(), getMeV2: jest.fn(), loginV2: jest.fn(), logoutV2: jest.fn(),
  switchTenantV2: jest.fn(), switchRoleV2: jest.fn(), fijarContextoV2: jest.fn(),
}));
jest.mock("@/lib/auth/token-refresh", () => ({ scheduleProactiveRefresh: jest.fn(), cancelProactiveRefresh: jest.fn(), refreshAccessToken: jest.fn(), isTokenExpiringSoon: jest.fn(() => false) }));

const PLAT = { id: "t-plat", slug: "plat", display_name: "Plataforma", subscribed_cores: [] };
const CAJA = { id: "t-caja", slug: "caja", display_name: "Caja QA", subscribed_cores: [] };
const ROL = { role_key: "platform_superadmin", core_name: "x", display_name: "s" };
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  localStorage.clear();
  tokenStorage.clearTokens();
  jest.clearAllMocks();
  tokenStorage.setTokens({ accessToken: "a0", refreshToken: "r0" });
  (refreshTokenV2 as jest.Mock).mockResolvedValue({ ok: true, status: 200, data: { access_token: "a1", refresh_token: "r1", expires_in: 900 } });
  (getMeV2 as jest.Mock).mockResolvedValue({ ok: true, status: 200, data: { user: { id: "u1", email: "qa@nadakki.test" }, current_tenant: PLAT, all_tenants: [], active_roles: [ROL] } });
});

test("fijarContexto llama al POST con {tenant, vista}, guarda tokens y cambia el tenant", async () => {
  (fijarContextoV2 as jest.Mock).mockResolvedValue({ ok: true, data: { access_token: "a2", refresh_token: "r2", expires_in: 900, new_tenant: CAJA, active_roles: [ROL], contexto: { tenant_id: "t-caja", vista: "banco" } } });
  const h = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(h.result.current.isLoading).toBe(false));
  let r: { ok: boolean } | undefined;
  await act(async () => { r = await h.result.current.fijarContexto!("t-caja", "banco"); });
  expect(r?.ok).toBe(true);
  expect(fijarContextoV2).toHaveBeenCalledWith("a1", "t-caja", "banco");
  expect(h.result.current.tenant?.id).toBe("t-caja");
  expect(tokenStorage.getAccessToken()).toBe("a2");
  expect(tokenStorage.getRefreshToken()).toBe("r2");
});

test("si el POST falla no cambia el tenant ni los tokens", async () => {
  (fijarContextoV2 as jest.Mock).mockResolvedValue({ ok: false, status: 403, error: "HTTP 403" });
  const h = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(h.result.current.isLoading).toBe(false));
  let r: { ok: boolean } | undefined;
  await act(async () => { r = await h.result.current.fijarContexto!("t-caja", "banco"); });
  expect(r?.ok).toBe(false);
  expect(h.result.current.tenant?.id).toBe("t-plat");
  expect(tokenStorage.getAccessToken()).toBe("a1");
});
