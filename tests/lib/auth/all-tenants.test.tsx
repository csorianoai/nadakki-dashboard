/**
 * `all_tenants` de `/auth/me` llega al contexto. Antes `AuthProvider` lo
 * descartaba y "Cambiar tenant" no tenia con que decidir.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { useAuth } from "@/hooks/useAuth";
import { tokenStorage } from "@/lib/auth/token-storage";
import { getMeV2, loginV2, logoutV2, refreshTokenV2 } from "@/lib/api/auth-v2";

jest.mock("@/lib/api/auth-v2", () => ({
  refreshTokenV2: jest.fn(),
  getMeV2: jest.fn(),
  loginV2: jest.fn(),
  logoutV2: jest.fn(),
  switchTenantV2: jest.fn(),
  switchRoleV2: jest.fn(),
}));

jest.mock("@/lib/auth/token-refresh", () => ({
  scheduleProactiveRefresh: jest.fn(),
  cancelProactiveRefresh: jest.fn(),
  refreshAccessToken: jest.fn(),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const refreshMock = refreshTokenV2 as jest.MockedFunction<typeof refreshTokenV2>;
const meMock = getMeV2 as jest.MockedFunction<typeof getMeV2>;
const loginMock = loginV2 as jest.MockedFunction<typeof loginV2>;
const logoutMock = logoutV2 as jest.MockedFunction<typeof logoutV2>;

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const CAJA = { id: "t-caja", slug: "caja", display_name: "Caja Mapaal", subscribed_cores: [] };
const OTRO = { id: "t-otro", slug: "otro", display_name: "Otro", subscribed_cores: [] };

function me(allTenants?: unknown[]) {
  return {
    ok: true as const,
    status: 200,
    data: {
      user: { id: "u1", email: "carolina@cajamapaal.test" },
      current_tenant: CAJA,
      ...(allTenants ? { all_tenants: allTenants } : {}),
      active_roles: [{ role_key: "tenant_admin", core_name: "accounting" }],
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  tokenStorage.clearTokens();
  jest.clearAllMocks();
  refreshMock.mockResolvedValue({
    ok: true,
    status: 200,
    data: { access_token: "a", refresh_token: "r", expires_in: 900 },
  });
});

async function montarConSesion() {
  tokenStorage.setTokens({ accessToken: "a0", refreshToken: "r0" });
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

test("al restaurar la sesion expone all_tenants", async () => {
  meMock.mockResolvedValue(me([CAJA, OTRO]) as never);
  const { result } = await montarConSesion();
  expect(result.current.allTenants.map((t) => t.id)).toEqual(["t-caja", "t-otro"]);
});

test("sin all_tenants en /me queda vacio, no undefined", async () => {
  meMock.mockResolvedValue(me() as never);
  const { result } = await montarConSesion();
  expect(result.current.allTenants).toEqual([]);
});

test("tras el login se pide /me y se rellena; el logout lo vacia", async () => {
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  loginMock.mockResolvedValue({
    ok: true,
    data: {
      access_token: "a",
      refresh_token: "r",
      token_type: "bearer",
      expires_in: 900,
      user_info: { id: "u1", email: "carolina@cajamapaal.test" },
      tenant_info: CAJA,
      active_role: { role_key: "tenant_admin", core_name: "accounting" },
      mfa_required: false,
    },
  } as never);
  meMock.mockResolvedValue(me([CAJA, OTRO]) as never);
  await act(async () => {
    await hook.result.current.login("carolina@cajamapaal.test", "x");
  });
  await waitFor(() => expect(hook.result.current.allTenants).toHaveLength(2));

  logoutMock.mockResolvedValue({ ok: true } as never);
  await act(async () => {
    await hook.result.current.logout();
  });
  expect(hook.result.current.allTenants).toEqual([]);
});

test("si /me falla tras el login, la lista se queda vacia", async () => {
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  loginMock.mockResolvedValue({
    ok: true,
    data: {
      access_token: "a",
      refresh_token: "r",
      token_type: "bearer",
      expires_in: 900,
      user_info: { id: "u1", email: "carolina@cajamapaal.test" },
      tenant_info: CAJA,
      active_role: { role_key: "tenant_admin", core_name: "accounting" },
      mfa_required: false,
    },
  } as never);
  meMock.mockRejectedValue(new Error("red"));
  await act(async () => {
    await hook.result.current.login("carolina@cajamapaal.test", "x");
  });
  expect(hook.result.current.allTenants).toEqual([]);
});
