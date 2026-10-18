import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/auth/auth-context", () => ({
  clearLocalStorage: jest.fn(),
  getPostLoginRedirectPath: jest.fn(() => "/autos/dealer"),
}));
jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { clearTokens: jest.fn() } }));
jest.mock("@/lib/dealer-management/admin-host", () => ({ resolveDealerAdminHost: jest.fn() }));
jest.mock("@/lib/hooks/usePublicTenantBrandingBySlug", () => ({ usePublicTenantBrandingBySlug: jest.fn() }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const LoginPage = require("@/app/(auth)/login/page").default;
const { useRouter } = jest.requireMock("next/navigation") as { useRouter: jest.Mock };
const { useAuth } = jest.requireMock("@/hooks/useAuth") as { useAuth: jest.Mock };
const { resolveDealerAdminHost } = jest.requireMock("@/lib/dealer-management/admin-host") as { resolveDealerAdminHost: jest.Mock };
const { usePublicTenantBrandingBySlug } = jest.requireMock("@/lib/hooks/usePublicTenantBrandingBySlug") as { usePublicTenantBrandingBySlug: jest.Mock };

const push = jest.fn();
const login = jest.fn();

async function iniciarSesion() {
  render(<LoginPage />);
  fireEvent.change(await screen.findByPlaceholderText("admin@tu-institucion.com"), { target: { value: "dealer@example.com" } });
  const form = screen.getByPlaceholderText("admin@tu-institucion.com").closest("form")!;
  fireEvent.change(form.querySelector<HTMLInputElement>('input[type="password"]')!, { target: { value: "x" } });
  fireEvent.click(screen.getByRole("button", { name: "Iniciar Sesión" }));
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  useRouter.mockReturnValue({ push });
  useAuth.mockReturnValue({ login, logout: jest.fn(), tenant: null, isAuthenticated: false, isLoading: false, allRoles: [], activeRole: null, initError: null, retryInit: jest.fn() });
  resolveDealerAdminHost.mockReturnValue({ mode: "dealer_subdomain", tenantSlug: "mapaal" });
  usePublicTenantBrandingBySlug.mockReturnValue({ data: null, isPending: false });
  login.mockResolvedValue({ ok: true, redirectTo: "/autos/dealer" });
  global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as jest.Mock;
});

it("(e) claim dealer y /acceso 200 → /realtor", async () => {
  mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ roles: [] }) });
  await iniciarSesion();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/realtor"));
  expect(push).not.toHaveBeenCalledWith("/autos/dealer");
});

it.each([403, 401, 404, 500])("(e) claim dealer y /acceso %s → /autos/dealer", async (status) => {
  mockApiFetch.mockResolvedValue({ status });
  await iniciarSesion();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/autos/dealer"));
  expect(push).not.toHaveBeenCalledWith("/realtor");
});

it("(e) /acceso con error de red → /autos/dealer", async () => {
  mockApiFetch.mockRejectedValue(new Error("red"));
  await iniciarSesion();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/autos/dealer"));
});

it("interruptor del panel apagado: no se consulta /acceso", async () => {
  delete process.env.NEXT_PUBLIC_REALTOR_PANEL;
  await iniciarSesion();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/autos/dealer"));
  expect(mockApiFetch).not.toHaveBeenCalled();
});

it("otro destino por rol no se consulta ni se desvía", async () => {
  login.mockResolvedValue({ ok: true, redirectTo: "/credit-hub/bank-v2" });
  await iniciarSesion();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/credit-hub/bank-v2"));
  expect(mockApiFetch).not.toHaveBeenCalled();
});
