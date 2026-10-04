/**
 * "Cambiar tenant" solo si hay a que cambiar, y el menu ya no lleva a /tenants.
 *
 * Verificado en produccion con cajamapaal+carolina: el enlace era incondicional
 * y abria `/tenants`, una pantalla de plataforma con tenants inventados.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ForgeGlobalCoresSidebar } from "@/components/forge/layout/ForgeGlobalCoresSidebar";
import { NAV_SECTIONS, type NavItem } from "@/components/forge/layout/forge-global-sidebar-nav";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

type T = { id: string; slug: string; display_name: string; subscribed_cores: string[] };
const MAPAAL: T = { id: "t-mapaal", slug: "mapaal", display_name: "Mapaal", subscribed_cores: [] };
const OTRO: T = { id: "t-otro", slug: "otro", display_name: "Otro Tenant", subscribed_cores: [] };

const ROLES = [{ core_name: "platform", role_key: "tenant_admin" }];
const USER = { email: "carolina@cajamapaal.test", name: "Carolina" };

let allTenants: T[] | undefined = [];
const switchTenant = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    tenant: MAPAAL,
    // Referencias estables: un array nuevo por render dispara los efectos del
    // sidebar en bucle.
    allRoles: ROLES,
    allTenants,
    user: USER,
    activeRole: ROLES[0],
    isAuthenticated: true,
    switchTenant,
  }),
}));

jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: null, isPending: false, isLoading: false }),
}));

jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: () => ({
    isError: false,
    error: null,
    isPending: true,
    isLoading: true,
    data: undefined,
  }),
}));

function montar() {
  return render(<ForgeGlobalCoresSidebar mobileOpen={false} onNavigate={() => {}} />);
}

beforeEach(() => {
  window.localStorage.clear();
  switchTenant.mockReset();
});

describe("Cambiar tenant", () => {
  it("con un solo tenant no se pinta", () => {
    allTenants = [MAPAAL];
    montar();
    expect(screen.queryByText("Cambiar tenant")).toBeNull();
  });

  it("sin la lista (sesion cargando o mock viejo) no se pinta", () => {
    allTenants = undefined;
    montar();
    expect(screen.queryByText("Cambiar tenant")).toBeNull();
  });

  it("con mas de uno se pinta y lista solo los OTROS tenants", () => {
    allTenants = [MAPAAL, OTRO];
    montar();
    const caja = screen.getByTestId("sidebar-cambiar-tenant");
    expect(caja).toHaveTextContent("Cambiar tenant");
    expect(screen.getByRole("button", { name: "Otro Tenant" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mapaal" })).toBeNull();
  });

  it("no enlaza a /tenants: cambia con switchTenant", async () => {
    allTenants = [MAPAAL, OTRO];
    switchTenant.mockResolvedValue({ ok: false, error: "x" });
    const { container } = montar();
    expect(container.querySelector('a[href="/tenants"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Otro Tenant" }));
    await waitFor(() => expect(switchTenant).toHaveBeenCalledWith("t-otro"));
  });
});

describe("/tenants fuera del menu", () => {
  it("ningun item del menu apunta a /tenants", () => {
    const hrefs: string[] = [];
    const walk = (it: NavItem) => {
      if (it.href) hrefs.push(it.href);
      it.children?.forEach(walk);
    };
    NAV_SECTIONS.forEach((s) => s.children.forEach(walk));
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs).not.toContain("/tenants");
  });
});
