/**
 * PS-1-SESION-UI: must_change_password / PASSWORD_CHANGE_REQUIRED no son un
 * «fallo de sesión»: la sesión se mantiene y se enruta al cambio de contraseña.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, SESSION_INIT_TIMEOUT_MS } from "@/lib/auth/auth-context";
import { useAuth } from "@/hooks/useAuth";
import { tokenStorage } from "@/lib/auth/token-storage";
import { changePasswordV2, getMeV2, loginV2, refreshTokenV2 } from "@/lib/api/auth-v2";
import { goToPasswordChange } from "@/lib/auth/password-change-route";

jest.mock("@/lib/api/auth-v2", () => ({
  refreshTokenV2: jest.fn(),
  getMeV2: jest.fn(),
  loginV2: jest.fn(),
  logoutV2: jest.fn(),
  switchTenantV2: jest.fn(),
  switchRoleV2: jest.fn(),
  changePasswordV2: jest.fn(),
}));

jest.mock("@/lib/auth/token-refresh", () => ({
  scheduleProactiveRefresh: jest.fn(),
  cancelProactiveRefresh: jest.fn(),
  refreshAccessToken: jest.fn(),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("@/lib/auth/password-change-route", () => ({
  PASSWORD_CHANGE_REQUIRED: "PASSWORD_CHANGE_REQUIRED",
  PASSWORD_CHANGE_ROUTE: "/cambiar-contrasena",
  goToPasswordChange: jest.fn(),
}));

const refreshMock = refreshTokenV2 as jest.MockedFunction<typeof refreshTokenV2>;
const meMock = getMeV2 as jest.MockedFunction<typeof getMeV2>;
const changeMock = changePasswordV2 as jest.MockedFunction<typeof changePasswordV2>;
const goMock = goToPasswordChange as jest.MockedFunction<typeof goToPasswordChange>;

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const REFRESH = (must: boolean) =>
  ({
    ok: true,
    status: 200,
    data: { access_token: "access-nuevo", refresh_token: "refresh-nuevo", must_change_password: must },
  }) as never;

const ME_OK = {
  ok: true,
  status: 200,
  data: {
    user: { id: "u1", email: "usuario@qa.test" },
    current_tenant: { id: "t-qa", display_name: "QA" },
    active_roles: [{ role_key: "tenant_admin", core_name: "accounting" }],
  },
} as never;

async function montar() {
  const hook = renderHook(() => useAuth(), { wrapper });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(SESSION_INIT_TIMEOUT_MS - 1);
  });
  expect(hook.result.current.isLoading).toBe(false);
  return hook;
}

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  tokenStorage.clearTokens();
  jest.clearAllMocks();
  tokenStorage.setTokens({ accessToken: "access-viejo", refreshToken: "refresh-viejo" });
});
afterEach(() => jest.useRealTimers());

describe("cambio de contraseña obligatorio", () => {
  test("(a) /refresh 200 con must_change_password=true: no es fallo y se navega al cambio", async () => {
    refreshMock.mockResolvedValue(REFRESH(true));

    const { result } = await montar();

    expect(result.current.initError).toBeNull();
    expect(result.current.mustChangePassword).toBe(true);
    expect(goMock).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getRefreshToken()).toBe("refresh-nuevo");
  });

  test("(a2) /me 200 con must_change_password=true: mismo resultado", async () => {
    refreshMock.mockResolvedValue(REFRESH(false));
    meMock.mockResolvedValue({ ...(ME_OK as object), data: { ...(ME_OK as any).data, must_change_password: true } } as never);

    const { result } = await montar();

    expect(result.current.initError).toBeNull();
    expect(result.current.mustChangePassword).toBe(true);
    expect(goMock).toHaveBeenCalledTimes(1);
  });

  test("(b) 403 PASSWORD_CHANGE_REQUIRED en /me: mismo resultado", async () => {
    refreshMock.mockResolvedValue(REFRESH(false));
    meMock.mockResolvedValue({
      ok: false,
      status: 403,
      error: "HTTP 403",
      errorCode: "PASSWORD_CHANGE_REQUIRED",
    } as never);

    const { result } = await montar();

    expect(result.current.initError).toBeNull();
    expect(result.current.mustChangePassword).toBe(true);
    expect(goMock).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getRefreshToken()).toBe("refresh-nuevo");
  });

  test("(c) 403 de otro tipo: mensaje genérico con Reintentar y sin navegar", async () => {
    refreshMock.mockResolvedValue(REFRESH(false));
    meMock.mockResolvedValue({ ok: false, status: 403, error: "HTTP 403", errorCode: "OTRO" } as never);

    const { result } = await montar();

    expect(result.current.initError).toBe("No se pudo verificar la sesión. Intenta de nuevo.");
    expect(result.current.mustChangePassword).toBe(false);
    expect(typeof result.current.retryInit).toBe("function");
    expect(goMock).not.toHaveBeenCalled();
  });

  test("(d) tras cambiar la contraseña se repite /refresh y /me y la sesión carga", async () => {
    refreshMock.mockResolvedValueOnce(REFRESH(true));
    const { result } = await montar();
    expect(result.current.mustChangePassword).toBe(true);

    changeMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        access_token: "access-limpio",
        refresh_token: "refresh-limpio",
        token_type: "bearer",
        expires_in: 900,
        must_change_password: false,
      },
    } as never);
    refreshMock.mockResolvedValue(REFRESH(false));
    meMock.mockResolvedValue(ME_OK);

    let r: { ok: boolean } | undefined;
    await act(async () => {
      r = await result.current.changePassword("actual", "nueva-contrasena-larga");
    });
    expect(r?.ok).toBe(true);
    expect(changeMock).toHaveBeenCalledWith("access-nuevo", "actual", "nueva-contrasena-larga");
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(refreshMock).toHaveBeenLastCalledWith("refresh-limpio");
    expect(meMock).toHaveBeenCalledTimes(1);
    expect(result.current.mustChangePassword).toBe(false);
    expect(result.current.initError).toBeNull();
  });

  test("cambio rechazado: devuelve el error_code y no repite el init", async () => {
    refreshMock.mockResolvedValueOnce(REFRESH(true));
    const { result } = await montar();
    changeMock.mockResolvedValue({
      ok: false,
      status: 403,
      error: "HTTP 403",
      errorCode: "INVALID_CURRENT_PASSWORD",
    } as never);

    let r: { ok: boolean; errorCode?: string } | undefined;
    await act(async () => {
      r = await result.current.changePassword("mala", "nueva-contrasena-larga");
    });

    expect(r).toMatchObject({ ok: false, errorCode: "INVALID_CURRENT_PASSWORD" });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.mustChangePassword).toBe(true);
  });

  test("login con must_change_password=true: no autentica, navega al cambio y no manda a la Suite", async () => {
    refreshMock.mockResolvedValue({ ok: false, status: 401 } as never);
    const { result } = await montar();
    (loginV2 as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        access_token: "access-login",
        refresh_token: "refresh-login",
        must_change_password: true,
        user_info: { id: "u1", email: "usuario@qa.test" },
        tenant_info: { id: "t-qa", display_name: "QA" },
        active_role: { role_key: "tenant_admin", core_name: "accounting" },
      },
    } as never);
    goMock.mockClear();

    let r: { redirectTo?: string; mustChangePassword?: boolean } | undefined;
    await act(async () => {
      r = await result.current.login("usuario@qa.test", "inicial");
    });

    expect(r).toMatchObject({ redirectTo: "/cambiar-contrasena", mustChangePassword: true });
    expect(result.current.mustChangePassword).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(goMock).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getRefreshToken()).toBe("refresh-login");
  });

  test("logout limpia mustChangePassword", async () => {
    refreshMock.mockResolvedValueOnce(REFRESH(true));
    const { result } = await montar();
    expect(result.current.mustChangePassword).toBe(true);
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.mustChangePassword).toBe(false);
  });
});
