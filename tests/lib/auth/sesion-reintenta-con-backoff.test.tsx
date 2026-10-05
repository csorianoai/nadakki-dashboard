/**
 * W0-2: "Verificando sesion" -> timeout acotado -> reintento -> no logout.
 *
 * #574 dejo la regla "solo un 401 cierra la sesion", pero un solo fallo
 * transitorio (el refresh que expira con el backend en frio, un 502, la red
 * caida un segundo) pintaba el error de inmediato y obligaba a pulsar
 * "Reintentar". Medido: `refreshTokenV2` se llamaba UNA vez.
 *
 * Ahora el init reintenta solo, con backoff, y unicamente si sigue fallando
 * pinta "No se pudo verificar la sesion" con los tokens intactos. Un 401 no se
 * reintenta: cierra la sesion a la primera.
 */

import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  AuthProvider,
  SESSION_INIT_RETRY_DELAYS_MS,
  SESSION_INIT_TIMEOUT_MS,
} from "@/lib/auth/auth-context";
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
  data: { access_token: "access-nuevo", refresh_token: "refresh-nuevo" },
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

const TIMEOUT = {
  ok: false,
  status: 0,
  error: "Tiempo de espera agotado — /api/v2/auth/refresh",
};

function conSesionGuardada() {
  tokenStorage.setTokens({ accessToken: "access-viejo", refreshToken: "refresh-viejo" });
}

/** Deja correr promesas pendientes y avanza el reloj falso `ms`. */
async function avanzar(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

/** Deja que el init termine: reintentos y backoff incluidos, bajo el techo. */
async function dejarTerminar() {
  await avanzar(SESSION_INIT_TIMEOUT_MS - 1);
}

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  tokenStorage.clearTokens();
  jest.clearAllMocks();
  meMock.mockResolvedValue(ME_OK as never);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("un fallo transitorio se reintenta solo, con backoff", () => {
  test("el refresh expira una vez (backend en frio) y la sesion se recupera sin pulsar nada", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValueOnce(TIMEOUT as never).mockResolvedValue(SESION_OK as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await dejarTerminar();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.initError).toBeNull();
    expect(result.current.tenant?.id).toBe("t-caja");
    expect(refreshMock).toHaveBeenCalledTimes(2);
    expect(refreshMock).toHaveBeenNthCalledWith(2, "refresh-viejo");
  });

  test("el segundo intento espera el backoff, no martillea al backend", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue({ ok: false, status: 502, error: "HTTP 502" } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await avanzar(0);
    expect(refreshMock).toHaveBeenCalledTimes(1);

    const [primera, segunda] = SESSION_INIT_RETRY_DELAYS_MS;
    await avanzar(primera - 1);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    await avanzar(1);
    expect(refreshMock).toHaveBeenCalledTimes(2);

    // El backoff crece.
    expect(segunda).toBeGreaterThan(primera);
    await avanzar(segunda - 1);
    expect(refreshMock).toHaveBeenCalledTimes(2);
    await avanzar(1);
    expect(refreshMock).toHaveBeenCalledTimes(3);

    expect(result.current.isLoading).toBe(false);
  });

  test("/me da 500 una vez y el reintento lo recupera", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue(SESION_OK as never);
    meMock
      .mockResolvedValueOnce({ ok: false, status: 500, error: "HTTP 500" } as never)
      .mockResolvedValue(ME_OK as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await dejarTerminar();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.initError).toBeNull();
    expect(meMock).toHaveBeenCalledTimes(2);
  });

  test("una excepcion de red tambien se reintenta", async () => {
    conSesionGuardada();
    refreshMock
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValue(SESION_OK as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await dejarTerminar();
    expect(result.current.isAuthenticated).toBe(true);
    expect(refreshMock).toHaveBeenCalledTimes(2);
  });
});

describe("si sigue fallando: aviso, y la sesion NO se cierra", () => {
  test("503 persistente: se agotan los reintentos, aviso y tokens intactos", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue({ ok: false, status: 503, error: "HTTP 503" } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await dejarTerminar();
    expect(result.current.isLoading).toBe(false);
    expect(refreshMock).toHaveBeenCalledTimes(1 + SESSION_INIT_RETRY_DELAYS_MS.length);
    expect(result.current.initError).toBe("No se pudo verificar la sesión. Intenta de nuevo.");
    expect(result.current.isAuthenticated).toBe(false);
    expect(tokenStorage.getRefreshToken()).toBe("refresh-viejo");
  });

  test("todos los reintentos caben dentro del techo del init", () => {
    const backoffTotal = SESSION_INIT_RETRY_DELAYS_MS.reduce((a, b) => a + b, 0);
    expect(backoffTotal).toBeLessThan(SESSION_INIT_TIMEOUT_MS);
    expect(SESSION_INIT_TIMEOUT_MS).toBeLessThanOrEqual(20_000);
  });

  test("un refresh colgado no espera para siempre: el techo pinta el aviso sin borrar tokens", async () => {
    conSesionGuardada();
    refreshMock.mockReturnValue(new Promise(() => {}) as never);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await avanzar(SESSION_INIT_TIMEOUT_MS);

    expect(result.current.isLoading).toBe(false);
    expect(result.current.initError).toBe(
      "El servidor no respondió a tiempo. Verifica tu conexión.",
    );
    expect(tokenStorage.getRefreshToken()).toBe("refresh-viejo");
  });
});

describe("un 401 real no se reintenta: cierra la sesion a la primera", () => {
  test("401 del refresh", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue({ ok: false, status: 401, error: "Credenciales inválidas." } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await dejarTerminar();
    expect(result.current.isLoading).toBe(false);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(result.current.initError).toBe("Tu sesión expiró. Inicia sesión nuevamente.");
  });

  test("401 de /me", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue(SESION_OK as never);
    meMock.mockResolvedValue({ ok: false, status: 401, error: "Credenciales inválidas." } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await dejarTerminar();
    expect(result.current.isLoading).toBe(false);
    expect(meMock).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  test("un 4xx que no es 401 (403 tenant perdido) no se reintenta ni borra tokens", async () => {
    conSesionGuardada();
    refreshMock.mockResolvedValue({ ok: false, status: 403, error: "HTTP 403" } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await dejarTerminar();
    expect(result.current.isLoading).toBe(false);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getRefreshToken()).toBe("refresh-viejo");
    expect(result.current.initError).toBe("No se pudo verificar la sesión. Intenta de nuevo.");
  });
});
