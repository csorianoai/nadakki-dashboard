/**
 * PS-1-SESION-UI: con must_change_password=true la sesión no es «sin sesión»:
 * ProtectedRoute no manda a /login y deja pintar solo la pantalla de cambio.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ProtectedRoute } from "@/components/forge/auth/ProtectedRoute";
import { getMeV2, refreshTokenV2 } from "@/lib/api/auth-v2";
import { tokenStorage } from "@/lib/auth/token-storage";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: jest.fn() }),
}));
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
  PASSWORD_CHANGE_ROUTE: "/cambiar-contrasena",
  PASSWORD_CHANGE_REQUIRED: "PASSWORD_CHANGE_REQUIRED",
  goToPasswordChange: jest.fn(),
}));

const refreshMock = refreshTokenV2 as jest.MockedFunction<typeof refreshTokenV2>;
const meMock = getMeV2 as jest.MockedFunction<typeof getMeV2>;

function montar() {
  return render(
    <AuthProvider>
      <ProtectedRoute>pantalla</ProtectedRoute>
    </AuthProvider>,
  );
}

describe("ProtectedRoute con cambio de contraseña obligatorio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, "", "/cambiar-contrasena");
    tokenStorage.setTokens({ accessToken: "a", refreshToken: "r" });
    refreshMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { access_token: "a2", refresh_token: "r2", must_change_password: true },
    } as never);
  });

  test("/refresh con must_change_password: la ruta de cambio se pinta y no hay replace('/login')", async () => {
    montar();
    expect(await screen.findByText("pantalla")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  test("403 PASSWORD_CHANGE_REQUIRED en /me: igual", async () => {
    refreshMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { access_token: "a2", refresh_token: "r2", must_change_password: false },
    } as never);
    meMock.mockResolvedValue({
      ok: false,
      status: 403,
      errorCode: "PASSWORD_CHANGE_REQUIRED",
    } as never);
    montar();
    expect(await screen.findByText("pantalla")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  test("en otra ruta no se pinta el contenido ni se manda a /login", async () => {
    window.history.pushState({}, "", "/dashboard");
    montar();
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("pantalla")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
});
