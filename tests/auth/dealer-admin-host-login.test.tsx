import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/auth/auth-context", () => ({
  clearLocalStorage: jest.fn(),
  getPostLoginRedirectPath: jest.fn(() => "/"),
}));

jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { clearTokens: jest.fn() },
}));

jest.mock("@/lib/dealer-management/admin-host", () => ({
  resolveDealerAdminHost: jest.fn(),
}));

jest.mock("@/lib/hooks/usePublicTenantBrandingBySlug", () => ({
  usePublicTenantBrandingBySlug: jest.fn(),
}));

const { AUTH_TENANT_CONTEXT_MISMATCH } = require("@/lib/api/auth-v2");
const LoginPage = require("@/app/(auth)/login/page").default;
const { useRouter } = jest.requireMock("next/navigation") as { useRouter: jest.Mock };
const { useAuth } = jest.requireMock("@/hooks/useAuth") as { useAuth: jest.Mock };
const { clearLocalStorage, getPostLoginRedirectPath } = jest.requireMock(
  "@/lib/auth/auth-context",
) as { clearLocalStorage: jest.Mock; getPostLoginRedirectPath: jest.Mock };
const { tokenStorage } = jest.requireMock("@/lib/auth/token-storage") as {
  tokenStorage: { clearTokens: jest.Mock };
};
const { resolveDealerAdminHost } = jest.requireMock("@/lib/dealer-management/admin-host") as {
  resolveDealerAdminHost: jest.Mock;
};
const { usePublicTenantBrandingBySlug } = jest.requireMock(
  "@/lib/hooks/usePublicTenantBrandingBySlug",
) as { usePublicTenantBrandingBySlug: jest.Mock };

const push = jest.fn();
const login = jest.fn();
const logout = jest.fn().mockResolvedValue(undefined);

function getPasswordInput(): HTMLInputElement {
  const emailInput = screen.getByPlaceholderText("admin@tu-institucion.com");
  const loginForm = emailInput.closest("form");
  expect(loginForm).not.toBeNull();

  const passwordInput = loginForm?.querySelector<HTMLInputElement>('input[type="password"]') ?? null;
  expect(passwordInput).not.toBeNull();
  return passwordInput as HTMLInputElement;
}

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push });
  useAuth.mockReturnValue({
    login,
    logout,
    tenant: null,
    isAuthenticated: false,
    isLoading: false,
    allRoles: [],
    activeRole: null,
    initError: null,
    retryInit: jest.fn(),
  });
  resolveDealerAdminHost.mockReturnValue({ mode: "dealer_subdomain", tenantSlug: "mapaal" });
  usePublicTenantBrandingBySlug.mockReturnValue({ data: null, isPending: false });
  getPostLoginRedirectPath.mockReturnValue("/");
  login.mockResolvedValue({ ok: true, redirectTo: "/credit-hub/dealer" });
  global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as jest.Mock;
});

describe("dealer admin host login", () => {
  it("derives the tenant from the dealer hostname and prevents tenant override", async () => {
    render(<LoginPage />);

    await screen.findByTestId("dealer-admin-host-context");
    expect(screen.queryByPlaceholderText("tu-institucion")).not.toBeInTheDocument();
    expect(screen.getByText("mapaal.nadakki.com")).toBeInTheDocument();
    expect(usePublicTenantBrandingBySlug).toHaveBeenCalledWith("mapaal");

    fireEvent.change(screen.getByPlaceholderText("admin@tu-institucion.com"), {
      target: { value: "dealer@example.com" },
    });
    fireEvent.change(getPasswordInput(), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar Sesión" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("dealer@example.com", "correct-password", "mapaal");
    });
    expect(push).toHaveBeenCalledWith("/autos/dealer");
  });

  it("purges local auth material and blocks redirect on tenant mismatch", async () => {
    login.mockResolvedValue({ ok: false, error: AUTH_TENANT_CONTEXT_MISMATCH });
    render(<LoginPage />);

    await screen.findByTestId("dealer-admin-host-context");
    fireEvent.change(screen.getByPlaceholderText("admin@tu-institucion.com"), {
      target: { value: "dealer@example.com" },
    });
    fireEvent.change(getPasswordInput(), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar Sesión" }));

    expect(await screen.findByText(AUTH_TENANT_CONTEXT_MISMATCH)).toBeInTheDocument();
    expect(tokenStorage.clearTokens).toHaveBeenCalledTimes(1);
    expect(clearLocalStorage).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("preserves the universal dashboard tenant selector", async () => {
    resolveDealerAdminHost.mockReturnValue({ mode: "universal" });
    render(<LoginPage />);

    expect(await screen.findByPlaceholderText("tu-institucion")).toBeInTheDocument();
    expect(screen.queryByTestId("dealer-admin-host-context")).not.toBeInTheDocument();
  });
});
