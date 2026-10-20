import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import BancoV2Layout from "@/app/(forge)/credit-hub/bank-v2/layout";
import { BankChShell } from "@/components/credit-hub/bank/BankChShell";
import { ModuleShell } from "@/components/shell/ModuleShell";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { MODULOS } from "@/lib/modulos/registro";

/**
 * bank-v2 usa LAS MISMAS guardias que /credit-hub/bank (BankChShell), sin
 * simularlas: CHTenantGuard y CHPortalAccessGuard reales. Se compara lo que
 * pinta cada shell para el mismo usuario.
 */
const mockReplace = jest.fn();

type Sesion = { tenant: string | null; autenticado: boolean; rol: string | null };
let sesion: Sesion = { tenant: "t-1", autenticado: true, rol: "bank_analyst" };
const logout = jest.fn(async () => undefined);

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/bank-v2",
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
}));
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: sesion.autenticado,
    tenant: sesion.tenant ? { id: sesion.tenant } : null,
    activeRole: sesion.rol ? { role_key: sesion.rol, display_name: "Analista de crédito" } : null,
    logout,
  }),
}));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ apiTenantId: sesion.tenant, loading: false }),
}));
jest.mock("@/lib/hooks/useTenantBranding", () => ({
  useTenantBranding: () => ({ data: { display_name: "Banco Ejemplo", logo_url: null, locale: "es-DO", currency: "DOP" } }),
}));
// Dependencias del shell ACTUAL (no de las guardias), para poder montarlo en jsdom.
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({ tenantConfig: { institution_name: "Banco Ejemplo", branding: { logo_url: null } } }),
}));
jest.mock("@/lib/credit-hub/hooks/useNotifications", () => ({
  useNotifications: () => ({ items: [], unreadCount: 0, hidden: true }),
}));

// El armazón común que monta AppGate en /credit-hub/bank-v2 (PS-9-CARCASAS-2): su barra y su menú, con la sesión del rol.
jest.mock("@/components/dealer/DealerSuiteGate", () => ({ __esModule: true, DealerSuiteGate: ({ children }: { children: ReactNode }) => <>{children}</>, isDealerReachableSuitePath: () => false }));
jest.mock("@/components/white-label/TenantBrandedDocumentTitle", () => ({ __esModule: true, TenantBrandedDocumentTitle: () => null }));
jest.mock("@/components/nav/BuscadorNavegacion", () => ({ __esModule: true, EVENTO_ABRIR_BUSCADOR: "nadakki:abrir-buscador", BuscadorNavegacion: () => null }));
jest.mock("@/components/forge/auth/UserMenu", () => ({ __esModule: true, UserMenu: () => <button type="button">Usuario</button> }));
jest.mock("@/components/forge/auth/TenantSwitcher", () => ({ __esModule: true, TenantSwitcher: () => null }));
jest.mock("@/components/forge/layout/ProyectosFinanzasSidebarLinks", () => ({ __esModule: true, ProyectosFinanzasSidebarLinks: () => null }));
jest.mock("@/components/realtor/useRealtorAccess", () => ({ __esModule: true, useRealtorAccess: () => "apagado" }));
const CREDITO = MODULOS.find((m) => m.id === "credito")!;
const conSuite = (ui: ReactNode) => (
  <AuthContext.Provider
    value={{ user: { id: "u" }, tenant: { id: sesion.tenant, subscribed_cores: ["credit"] }, allRoles: [{ core_name: "credit", role_key: sesion.rol ?? "", display_name: "Rol" }], fijarContexto: jest.fn() } as unknown as AuthContextValue}
  >
    <ModuleShell modulo={CREDITO}>{ui}</ModuleShell>
  </AuthContext.Provider>
);

const Hijo = () => <p>contenido del banco</p>;
function pintar(shell: "actual" | "v2"): { html: string; texto: string } {
  const arbol: ReactNode =
    shell === "actual" ? <BankChShell><Hijo /></BankChShell> : <BancoV2Layout><Hijo /></BancoV2Layout>;
  const { container, unmount } = render(<>{arbol}</>);
  const bloqueo = container.querySelector("[data-testid^='ch-']");
  const salida = { html: bloqueo?.outerHTML ?? "", texto: container.textContent ?? "" };
  unmount();
  return salida;
}

describe("bank-v2: mismas guardias que /credit-hub/bank", () => {
  beforeEach(() => logout.mockClear());

  it.each<[string, Sesion, string]>([
    ["sin tenant", { tenant: null, autenticado: true, rol: "bank_analyst" }, "ch-tenant-guard-blocked"],
    ["sin sesion", { tenant: "t-1", autenticado: false, rol: null }, "ch-tenant-guard-blocked"],
    ["rol dealer", { tenant: "t-1", autenticado: true, rol: "dealer" }, "ch-portal-forbidden"],
    ["rol de marketing", { tenant: "t-1", autenticado: true, rol: "marketing_manager" }, "ch-portal-forbidden"],
  ])("%s: bloquea igual que el banco actual y no pinta contenido", (_caso, s, testId) => {
    sesion = s;
    const actual = pintar("actual");
    const v2 = pintar("v2");
    expect(actual.html).toContain(`data-testid="${testId}"`);
    expect(v2.html).toBe(actual.html);
    expect(v2.texto).not.toContain("contenido del banco");
    if (!s.autenticado) expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fcredit-hub%2Fbank-v2");
  });

  it.each(["bank_analyst", "bank_admin", "compliance_officer", "credit_admin", "tenant_admin"])(
    "rol %s: entra, con la marca del banco, la firma de Credit Hub y la mesa activa en el menú (ModuleShell, PS-9-CARCASAS-2)",
    (rol) => {
      sesion = { tenant: "t-1", autenticado: true, rol };
      render(
        conSuite(
          <BancoV2Layout>
            <Hijo />
          </BancoV2Layout>,
        ),
      );
      expect(screen.getByText("contenido del banco")).toBeInTheDocument();
      expect(screen.getByTestId("banco-marca")).toHaveTextContent("Banco Ejemplo");
      expect(screen.getByTestId("banco-firma")).toHaveTextContent("con Nadakki Credit Hub");
      expect(screen.getByRole("link", { name: "Mesa de decisiones (banco)" })).toHaveAttribute("aria-current", "page");
    },
  );

  it("el menu no enlaza pantallas del portal dealer (D-B5)", () => {
    sesion = { tenant: "t-1", autenticado: true, rol: "bank_analyst" };
    render(
      conSuite(
        <BancoV2Layout>
          <Hijo />
        </BancoV2Layout>,
      ),
    );
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.filter((h) => h.includes("/dealer"))).toEqual([]);
  });
});
