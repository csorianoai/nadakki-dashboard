/**
 * LA REGLA: solo un 401 cierra la sesion (D8, suite#1501).
 *
 * Un timeout o un error del servidor dejan los tokens donde estan, pintan el
 * error y ofrecen "Reintentar". Medido en produccion: Libro mayor y Balance
 * pintaban "El servidor no respondio a tiempo" y acababan en /login, porque el
 * `else` del refresh borraba los tokens de forma incondicional y la
 * comprobacion del 401 llegaba despues.
 *
 * El caso que mas duele es el ultimo de este fichero: pulsar "Reintentar"
 * cerraba la sesion, porque el init reejecutado ya no encontraba refresh token
 * y salia por la rama de "no hay sesion" sin `initError`, que es justo la que
 * ProtectedRoute convierte en una redireccion a /login.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { useAuth } from "@/hooks/useAuth";
import { tokenStorage } from "@/lib/auth/token-storage";
import { getMeV2, refreshTokenV2 } from "@/lib/api/auth-v2";

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

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const SESION_OK = {
  ok: true as const,
  status: 200,
  data: {
    access_token: "access-nuevo",
    refresh_token: "refresh-nuevo",
  },
};

const ME_OK = {
  ok: true as const,
  status: 200,
  data: {
    user: { id: "u1", email: "carolina@cajamapaal.test" },
    current_tenant: { id: "t-caja", display_name: "Caja Mapaal" },
    active_roles: [{ role_key: "tenant_admin", core_name: "accounting" }],
  },
};

/** Deja un refresh token guardado, como una sesion ya iniciada. */
function conSesionGuardada() {
  tokenStorage.setTokens({ accessToken: "access-viejo", refreshToken: "refresh-viejo" });
}

async function montar() {
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe("un timeout o un 5xx NO cierran la sesion", () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStorage.clearTokens();
    jest.clearAllMocks();
    meMock.mockResolvedValue(ME_OK as never);
  });

  test("timeout del refresh: los tokens sobreviven y hay error con Reintentar", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue({
      ok: false,
      status: 0,
      error: "Tiempo de espera agotado — /api/v2/auth/refresh",
    } as never);

    const { result } = await montar();

    expect(result.current.initError).toBe(
      "El servidor no respondió a tiempo. Verifica tu conexión.",
    );
    // Lo que importa: la sesion sigue ahi.
    expect(tokenStorage.getRefreshToken()).toBe("refresh-viejo");
    expect(typeof result.current.retryInit).toBe("function");
  });

  test("502 del refresh: los tokens sobreviven", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue({
      ok: false,
      status: 502,
      error: "HTTP 502 Bad Gateway — /api/v2/auth/refresh",
    } as never);

    const { result } = await montar();

    expect(result.current.initError).toBe("No se pudo verificar la sesión. Intenta de nuevo.");
    expect(tokenStorage.getRefreshToken()).toBe("refresh-viejo");
  });

  test("500 de /me: los tokens sobreviven", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue(SESION_OK as never);
    meMock.mockResolvedValue({
      ok: false,
      status: 500,
      error: "HTTP 500 — /api/v2/auth/me",
    } as never);

    const { result } = await montar();

    expect(result.current.initError).toBe("No se pudo verificar la sesión. Intenta de nuevo.");
    expect(tokenStorage.getRefreshToken()).toBe("refresh-nuevo");
  });

  test("excepcion de red: los tokens sobreviven", async () => {
    conSesionGuardada();
    refreshMock.mockRejectedValue(new Error("Failed to fetch"));

    const { result } = await montar();

    expect(result.current.initError).toBeTruthy();
    expect(tokenStorage.getRefreshToken()).toBe("refresh-viejo");
  });

  test("y en ningun caso queda autenticado por accidente", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue({ ok: false, status: 503, error: "HTTP 503" } as never);

    const { result } = await montar();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.initError).toBeTruthy();
  });
});

describe("un 401 real SI cierra la sesion", () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStorage.clearTokens();
    jest.clearAllMocks();
    meMock.mockResolvedValue(ME_OK as never);
  });

  test("401 del refresh: tokens borrados y mensaje de sesion expirada", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue({
      ok: false,
      status: 401,
      error: "Credenciales inválidas.",
    } as never);

    const { result } = await montar();

    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(result.current.initError).toBe("Tu sesión expiró. Inicia sesión nuevamente.");
  });

  test("401 de /me: tokens borrados", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue(SESION_OK as never);
    meMock.mockResolvedValue({ ok: false, status: 401, error: "Credenciales inválidas." } as never);

    const { result } = await montar();

    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(result.current.initError).toBe("Tu sesión expiró. Inicia sesión nuevamente.");
  });
});

describe("Reintentar reintenta — ya no es el logout", () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStorage.clearTokens();
    jest.clearAllMocks();
  });

  test("tras un timeout, Reintentar recupera la sesion", async () => {
    conSesionGuardada();
    // Primer intento: el backend esta frio y expira.
    refreshMock.mockResolvedValueOnce({
      ok: false,
      status: 0,
      error: "Tiempo de espera agotado — /api/v2/auth/refresh",
    } as never);
    // Segundo intento: ya caliente.
    refreshMock.mockResolvedValueOnce(SESION_OK as never);
    meMock.mockResolvedValue(ME_OK as never);

    const { result } = await montar();
    expect(result.current.initError).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(false);

    // Esto era el logout: el init reejecutado no encontraba refresh token.
    act(() => {
      result.current.retryInit();
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.initError).toBeNull();
    expect(result.current.tenant?.id).toBe("t-caja");
    expect(refreshMock).toHaveBeenCalledTimes(2);
    // El segundo intento uso el refresh token que el fallo NO borro.
    expect(refreshMock).toHaveBeenNthCalledWith(2, "refresh-viejo");
  });
});
