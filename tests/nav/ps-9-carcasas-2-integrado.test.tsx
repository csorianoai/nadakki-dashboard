/**
 * PS-9-CARCASAS-2 PARTE=3/7, prueba integrada: el Dealer OS (/autos/dealer/**) y el Centro Operativo
 * (/centro-operativo) abren sobre ModuleShell. AppGate + el layout REAL del dealer (DealerShell) = UNA sola barra (la
 * del armazón común), el menú del módulo Concesionarios filtrado por el plan (capability, PARTE 1/7) y sin el menú,
 * la barra ni la paleta propios del dealer (PARTE 2/7), con las acciones del dealer en el contenido. Falla sin
 * cualquiera de las tres partes. (a) una sola barra; (b) menú del registro (fuente del dealer) y migas de lib/migas.
 */
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppGate from "@/components/auth/AppGate";
import DealerLayout from "@/app/autos/dealer/layout";
import CentroOperativoLayout from "@/app/centro-operativo/layout";
import { DEALER_NAV_CAPABILITY_KEYS } from "@/components/dealer-management/shell/dealer-nav";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { MODULOS, usaCarcasaComun } from "@/lib/modulos/registro";

let pathname = "/autos/dealer/inventario";
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSelectedLayoutSegments: () => [],
}));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
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
jest.mock("@/components/credit-hub/shell/useChromeIdentity", () => ({ __esModule: true, useChromeIdentity: () => ({ name: "QA", initials: "Q", email: "qa@nadakki.test", role: "Banco" }) }));
jest.mock("@/components/forge/layout/ForgeCreditHubSidebar", () => ({ __esModule: true, ForgeCreditHubSidebar: () => <nav data-testid="forge-credit-hub-sidebar" /> }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({ useDealerManagementBranding: () => ({ data: undefined, isPending: false, isLoading: false }) }));
const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({ useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys) }));
// Testigos de lo que NO debe aparecer: la carcasa de la Suite y el chrome propio del dealer.
jest.mock("@/components/dealer-management/shell/DealerSidebar", () => ({ __esModule: true, DealerSidebar: () => <nav data-testid="carcasa-vieja-dealer-sidebar" /> }));
jest.mock("@/components/dealer-management/shell/DealerTopbar", () => ({ __esModule: true, DealerTopbar: () => <header data-testid="carcasa-vieja-dealer-topbar" /> }));

const TENANT = "tenant-qa";
const lote = (permitidas: readonly string[]) => ({
  isError: false, error: null, isPending: false, isLoading: false,
  data: { results: Object.fromEntries(DEALER_NAV_CAPABILITY_KEYS.map((k) => [k, { allowed: permitidas.includes(k) }])) },
});
// Un usuario de dealer de un tenant SIN el core «autos» en subscribed_cores: hoy DealerShell solo filtra por plan.
const sesion = {
  user: { id: "u", email: "dealer@nadakki.test" },
  tenant: { id: "t", display_name: "QA", subscribed_cores: ["credit"] },
  allRoles: [{ core_name: "autos", role_key: "dealer", display_name: "Dealer" }],
  fijarContexto: jest.fn(),
} as unknown as AuthContextValue;

function pintar(Layout: typeof DealerLayout) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["dealer-context-sync", TENANT], { estado: "sincronizado", assignment: { dealerId: "d-1", organizationUnitId: null, dealerName: "Concesionario QA" } });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={sesion}>
        <AppGate><Layout><p>pantalla del dealer</p></Layout></AppGate>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  batchMock.mockReset();
  batchMock.mockReturnValue(lote(DEALER_NAV_CAPABILITY_KEYS.filter((k) => k !== "autos.leads.crm")));
  window.localStorage.clear();
  window.localStorage.setItem("nadakki_tenant_id", TENANT);
});

const unaSolaBarraDeConcesionarios = () => {
  expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
  expect(screen.getByTestId("module-shell")).toHaveAttribute("data-modulo", "concesionarios");
  expect(screen.queryByTestId("forge-shell")).toBeNull();
  expect(screen.queryByTestId("carcasa-vieja-dealer-sidebar")).toBeNull();
  expect(screen.queryByTestId("carcasa-vieja-dealer-topbar")).toBeNull();
  expect(screen.getByText("pantalla del dealer")).toBeInTheDocument();
  expect(screen.getByTestId("dealer-acciones")).toBeInTheDocument();
};

describe("Dealer OS y Centro Operativo sobre ModuleShell", () => {
  test.each([
    ["/autos/dealer", DealerLayout],
    ["/autos/dealer/inventario", DealerLayout],
    ["/centro-operativo", CentroOperativoLayout],
  ])("%s: una sola barra, la del armazón común", (ruta, Layout) => {
    pathname = ruta;
    pintar(Layout);
    unaSolaBarraDeConcesionarios();
  });

  test("el menú es el del dealer, filtrado por el plan: sin permiso de leads no hay Leads", () => {
    pathname = "/autos/dealer/inventario";
    pintar(DealerLayout);
    const menu = within(screen.getByRole("complementary", { name: "Menú de Concesionarios" }));
    const hrefs = menu.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining(["/autos/dealer", "/autos/dealer/inventario", "/centro-operativo"]));
    expect(hrefs).not.toContain("/autos/dealer/leads");
  });

  test("registro: Concesionarios es carcasa común en sus dos prefijos, sin pantallas /grupo", () => {
    const m = MODULOS.find((x) => x.id === "concesionarios")!;
    expect(m.carcasa).toBe("comun");
    expect(m.sinPantallaGrupo).toBe(true);
    for (const r of ["/autos/dealer", "/autos/dealer/credito/solicitudes", "/centro-operativo"]) expect(usaCarcasaComun(r)).toBe(true);
  });
});
