/**
 * Entrada "Real Estate" en el menú lateral: visible solo con 200 de /api/v1/realestate/acceso (César
 * autoriza tocar el menú compartido para esto). Se mide el menú completo, no solo la pieza.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import { ForgeGlobalCoresSidebar } from "@/components/forge/layout/ForgeGlobalCoresSidebar";

jest.mock("next/navigation", () => ({ usePathname: () => "/credit-hub" }));
// Referencias estables: un objeto nuevo por render cambia las dependencias del menú y lo deja en bucle.
const mockAuth = {
  tenant: { id: "t1", slug: "ops", display_name: "Ops", subscribed_cores: [] as string[] },
  allRoles: [] as { core_name: string; role_key: string }[], user: { email: "a@b.c", name: "A" }, activeRole: null, isAuthenticated: true,
};
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: null, isPending: false, isLoading: false }),
}));
const mockBatch = { isError: false, error: null, isPending: false, isLoading: false, data: { results: {} } };
jest.mock("@/lib/access/hooks", () => ({ useAccessEntitlementsBatch: () => mockBatch }));
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => { mockApiFetch.mockReset(); delete process.env.NEXT_PUBLIC_REALTOR_PANEL; });

const settle = async () => {
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  await act(async () => { await mockApiFetch.mock.results[0].value.catch(() => undefined); await new Promise((r) => setTimeout(r, 0)); });
};

it("con 200 de /acceso aparece 'Real Estate' y enlaza a /realtor", async () => {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  mockApiFetch.mockResolvedValue({ status: 200 });
  render(<ForgeGlobalCoresSidebar mobileOpen={false} />);
  const link = await screen.findByRole("link", { name: /Real Estate/ });
  expect(link).toHaveAttribute("href", "/realtor");
  expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/realestate/acceso", expect.objectContaining({ method: "GET" }));
});

it.each([401, 403, 500])("con %s no aparece", async (status) => {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  mockApiFetch.mockResolvedValue({ status });
  render(<ForgeGlobalCoresSidebar mobileOpen={false} />);
  await settle();
  expect(screen.queryByRole("link", { name: /Real Estate/ })).toBeNull();
});

it("con el interruptor apagado no aparece ni se pregunta al backend", () => {
  render(<ForgeGlobalCoresSidebar mobileOpen={false} />);
  expect(screen.queryByRole("link", { name: /Real Estate/ })).toBeNull();
  expect(mockApiFetch).not.toHaveBeenCalled();
});
