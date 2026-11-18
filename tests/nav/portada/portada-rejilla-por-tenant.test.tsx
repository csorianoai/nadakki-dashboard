/**
 * C4-PORTADA-REJILLA-POR-TENANT (Cowork, prod 16-nov-2026, tenant Baylara = marketing + real_estate + sites):
 * la sección «Dominios de negocio» y la rejilla solo listan los cores del tenant; el superadmin ve todo.
 */
import { render } from "@testing-library/react";
import HomePage from "@/app/page";

type Rol = { role_key: string; core_name: string; display_name: string };
let auth: { allRoles: Rol[]; tenant: { subscribed_cores: string[] } | null; isLoading: boolean; isAuthenticated: boolean };
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => auth }));

const rol = (role_key: string, core_name: string): Rol => ({ role_key, core_name, display_name: role_key });

beforeEach(() => {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
});

const AJENOS = [/Contabilidad/, /Legal/, /Log[ií]stica/, /Compliance/, /Ventas/];

describe("rejilla de cores por tenant", () => {
  test("tenant marketing+real_estate+sites no ve módulos que no tiene", () => {
    auth = { allRoles: [rol("tenant_admin", "marketing")], tenant: { subscribed_cores: ["marketing", "real_estate", "sites"] }, isLoading: false, isAuthenticated: true };
    const { container } = render(<HomePage />);
    const texto = container.textContent ?? "";
    for (const re of AJENOS) expect(texto).not.toMatch(re);
    expect(texto).toMatch(/Marketing/);
  });

  test("platform_superadmin sigue viendo todos los cores", () => {
    auth = { allRoles: [rol("platform_superadmin", "platform")], tenant: { subscribed_cores: [] }, isLoading: false, isAuthenticated: true };
    const { container } = render(<HomePage />);
    const texto = container.textContent ?? "";
    for (const re of AJENOS) expect(texto).toMatch(re);
  });
});
