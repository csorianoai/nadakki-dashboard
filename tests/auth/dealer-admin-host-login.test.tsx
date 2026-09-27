import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";
import { AUTH_TENANT_CONTEXT_MISMATCH } from "@/lib/api/auth-v2";

const push = jest.fn();
const login = jest.fn();
const logout = jest.fn().mockResolvedValue(undefined);
const clearTokens = jest.fn();
const clearLocalStorage = jest.fn();
const brandingBySlug = jest.fn(() => ({ data: null, isPending: false }));
let hostMode: { mode: "dealer_subdomain"; tenantSlug: string } | { mode: "universal" } = {
  mode: "dealer_subdomain",
  tenantSlug: "mapaal",
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login,
    logout,
    tenant: null,
    isAuthenticated: false,
    isLoading: false,
    allRoles: [],
    activeRole: null,
    initError: null,
    retryInit: jest.fn(),
  }),
}));

jest.mock("@/lib/auth/auth-context", () => ({
  clearLocalStorage: () => clearLocalStorage(),
  getPostLoginRedirectPath: jest.fn(() => "/"),
}));

jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { clearTokens: () => clearTokens() },
}));

jest.mock("@/lib/dealer-management/admin-host", () => ({
  resolveDealerAdminHost: () => hostMode,
}));

jest.mock("@/lib/hooks/usePublicTenantBrandingBySlug", () => ({
  usePublicTenantBrandingBySlug: (slug?: string) => brandingBySlug(slug),
}));

beforeEach(() => {
  jest.clearAllMocks();
  hostMode = { mode: "dealer_subdomain", tenantSlug: "mapaal" };
  brandingBySlug.mockReturnValue({ data: null, isPending: false });
  login.mockResolvedValue({ ok: true, redirectTo: "/credit-hub/dealer" });
  global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as jest.Mock;
});

describe("dealer admin host login", () => {
  it("derives the tenant from the dealer hostname and prevents tenant override", async () => {
    render(<LoginPage />);

    await screen.findByTestId("dealer-admin-host-context");
    expect(screen.queryByLabelText(/Tenant \(opcional\)/i)).not.toBeInTheDocument();
    expect(screen.getByText("mapaal.nadakki.com")).toBeInTheDocument();
    expect(brandingBySlug).toHaveBeenCalledWith("mapaal");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dealer@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-password" } });
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
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dealer@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar Sesión" }));

    expect(await screen.findByText(AUTH_TENANT_CONTEXT_MISMATCH)).toBeInTheDocument();
    expect(clearTokens).toHaveBeenCalledTimes(1);
    expect(clearLocalStorage).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("preserves the universal dashboard tenant selector", async () => {
    hostMode = { mode: "universal" };
    render(<LoginPage />);

    expect(await screen.findByLabelText(/Tenant \(opcional\)/i)).toBeInTheDocument();
    expect(screen.queryByTestId("dealer-admin-host-context")).not.toBeInTheDocument();
  });
});
