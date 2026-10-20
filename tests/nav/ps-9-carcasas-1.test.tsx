/**
 * PS-9-CARCASAS-1 (parte 1, registro + AppGate): Crédito (Credit Hub) abre sobre ModuleShell. (a) una sola barra, sin la carcasa vieja
 * (ChAppShell / ForgeCreditHubAppShell) encima; (b) menú y migas salen de lib/navigation.ts. Dealer, bank-v2 (DccShell),
 * Cockpit de crédito y Monetización conservan su carcasa y NO se tocan en esta parte.
 */
import { render, screen } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { migasDe } from "@/lib/migas";
import { MODULOS, menuVisible, moduloDeRuta, tienePantallaGrupo, usaCarcasaComun } from "@/lib/modulos/registro";
import { NAVEGACION } from "@/lib/navigation";

let pathname = "/credit-hub";
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSelectedLayoutSegments: () => [],
}));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("@/components/forge/layout/GlobalForgeAppShell", () => ({ __esModule: true, GlobalForgeAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="forge-shell">{children}</div> }));
jest.mock("@/components/dealer/DealerSuiteGate", () => ({ __esModule: true, DealerSuiteGate: ({ children }: { children: React.ReactNode }) => <>{children}</>, isDealerReachableSuitePath: (p: string) => p.startsWith("/contable") }));
jest.mock("@/components/dealer/ContableChrome", () => ({ __esModule: true, ContableChrome: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("@/components/white-label/TenantBrandedDocumentTitle", () => ({ __esModule: true, TenantBrandedDocumentTitle: () => null }));
jest.mock("@/components/nav/BuscadorNavegacion", () => ({ __esModule: true, EVENTO_ABRIR_BUSCADOR: "nadakki:abrir-buscador", BuscadorNavegacion: () => null }));
jest.mock("@/components/forge/auth/UserMenu", () => ({ __esModule: true, UserMenu: () => <button type="button">Usuario</button> }));
jest.mock("@/components/forge/auth/TenantSwitcher", () => ({ __esModule: true, TenantSwitcher: () => null }));
jest.mock("@/components/forge/layout/ProyectosFinanzasSidebarLinks", () => ({ __esModule: true, ProyectosFinanzasSidebarLinks: () => null }));
jest.mock("@/components/realtor/useRealtorAccess", () => ({ __esModule: true, useRealtorAccess: () => "apagado" }));
jest.mock("@/components/ai/OnboardingAgent", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/credit-hub/system/CHTenantGuard", () => ({ __esModule: true, CHTenantGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("@/components/credit-hub/system/CHPortalAccessGuard", () => ({ __esModule: true, CHPortalAccessGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("@/components/credit-hub/system/CHFeatureFlagBanner", () => ({ __esModule: true, CHFeatureFlagBanner: () => null }));
jest.mock("@/components/credit-hub/system/CreditHubI18nBootstrap", () => ({ __esModule: true, CreditHubI18nBootstrap: () => null }));
jest.mock("@/components/forge/ui/DemoModeBanner", () => ({ __esModule: true, DemoModeBanner: () => null }));
jest.mock("@/components/forge/ui/Toast", () => ({ __esModule: true, ForgeToaster: () => null }));
jest.mock("@/app/(forge)/credit-hub/forge-globals.css", () => ({}));
jest.mock("@/app/credit-hub/credit-hub.css", () => ({}));
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({ __esModule: true, useTenantConfig: () => ({ tenantConfig: { is_demo: false, institution_name: "Banco QA", branding: {} } }) }));
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ __esModule: true, useTenant: () => ({ tenantSlug: "qa" }) }));
jest.mock("@/lib/hooks/useTenantBranding", () => ({ __esModule: true, useTenantBranding: () => ({ data: null, isPending: false }) }));
jest.mock("@/lib/credit-hub/hooks/useNotifications", () => ({ __esModule: true, useNotifications: () => ({ items: [], unreadCount: 0, hidden: true }) }));
jest.mock("@/components/credit-hub/shell/useChromeIdentity", () => ({ __esModule: true, useChromeIdentity: () => ({ name: "QA", initials: "Q", email: "qa@nadakki.test", role: "Banco" }) }));
jest.mock("@/hooks/useAuth", () => ({ __esModule: true, useAuth: () => ({ logout: jest.fn() }) }));
jest.mock("@/components/forge/layout/ForgeCreditHubSidebar", () => ({ __esModule: true, ForgeCreditHubSidebar: () => <nav data-testid="forge-credit-hub-sidebar" /> }));

const sesion = (cores: string[]) =>
  ({
    user: { id: "u", email: "qa@nadakki.test" },
    tenant: { id: "t", display_name: "QA", subscribed_cores: cores },
    allRoles: [{ core_name: "x", role_key: "platform_superadmin", display_name: "Superadmin" }],
    fijarContexto: jest.fn(),
  }) as unknown as AuthContextValue;
const conSesion = (ui: React.ReactNode) => <AuthContext.Provider value={sesion(["credit"])}>{ui}</AuthContext.Provider>;
const credito = MODULOS.find((m) => m.id === "credito")!;

describe("(a) las rutas de Crédito renderizan ModuleShell, una sola barra", () => {
  test.each(["/credit-hub", "/credit-hub/activacion", "/credit/dashboard"])("%s: AppGate -> ModuleShell del módulo crédito", (ruta) => {
    pathname = ruta;
    render(conSesion(<AppGate><p>pantalla</p></AppGate>));
    expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
    expect(screen.getByTestId("module-shell")).toHaveAttribute("data-modulo", "credito");
    expect(screen.queryByTestId("forge-shell")).toBeNull();
    expect(screen.getByRole("complementary", { name: "Menú de Crédito" })).toBeInTheDocument();
  });

  test("las rutas con carcasa propia (portal dealer, cockpit de crédito, monetización, SIC) no cambian; bank-v2 pasa a la común en PS-9-CARCASAS-2", () => {
    for (const r of ["/credit-hub/dealer", "/credit-hub/dealer/applications", "/credit-hub/admin", "/credit-hub/monetizacion/dashboard", "/sic", "/market-intel"]) {
      expect(usaCarcasaComun(r)).toBe(false);
    }
    for (const r of ["/credit-hub", "/credit-hub/bank", "/credit-hub/bank/applications", "/credit/dashboard", "/credit-hub/bank-v2"]) expect(usaCarcasaComun(r)).toBe(true);
  });

  test("sin pantalla de grupo: /credit-hub/grupo/<id> no existe como ruta", () => {
    expect(tienePantallaGrupo(credito)).toBe(false);
  });
});

describe("(b) menú y migas de Crédito salen de lib/navigation.ts", () => {
  const seccion = NAVEGACION.find((s) => s.id === "credit-hub")!;
  test("el menú es el de la sección credit-hub", () => {
    expect(credito.carcasa).toBe("comun");
    const ids = new Set(seccion.children.map((c) => c.id));
    const roles = [{ core_name: "x", role_key: "platform_superadmin", display_name: "S" }];
    const del = menuVisible(credito, { roles, subscribedCores: ["credit"] }).flatMap((g) => g.items);
    expect(del.length).toBeGreaterThan(2);
    for (const it of del) expect(ids.has(it.id)).toBe(true);
  });
  test("las migas de /credit-hub/bank/... cuelgan de la sección de navigation.ts, no de un menú vacío del banco", () => {
    const migas = migasDe("/credit-hub/bank/applications");
    expect(migas[0]!.href).toBe("/");
    expect(migas[1]!.label).toBe(seccion.label);
    expect(moduloDeRuta("/credit-hub/bank/applications")?.id).toBe("credito");
  });
});
