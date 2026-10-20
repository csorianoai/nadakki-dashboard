/**
 * PS-9-CARCASAS-2 PARTE=5/7, prueba integrada: la Contabilidad que abre el menú del dealer (/contable/**, la única
 * pantalla de la Suite que enlaza) ya no pinta el chrome viejo del dealer bajo la barra de la Suite. Para un usuario
 * de dealer, AppGate + ContableChrome = ModuleShell del módulo Concesionarios (UNA barra, el menú del dealer filtrado
 * por el plan) con DealerShell sin menú ni barra propios; para el resto, la Suite como antes, también con UNA barra.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppGate from "@/components/auth/AppGate";
import { DEALER_NAV_CAPABILITY_KEYS } from "@/components/dealer-management/shell/dealer-nav";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";

let pathname = "/contable/libro-mayor";
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSelectedLayoutSegments: () => [],
}));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("@/components/dealer/DealerSuiteGate", () => ({ __esModule: true, DealerSuiteGate: ({ children }: { children: React.ReactNode }) => <>{children}</>, isDealerReachableSuitePath: (p: string) => p.startsWith("/contable") }));
const contextoDealer = jest.fn();
jest.mock("@/lib/dealer/dealer-context-api", () => ({ fetchMyDealerContext: () => contextoDealer() }));
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
jest.mock("@/components/dealer-management/shell/DealerCommandPalette", () => ({ __esModule: true, DealerCommandPalette: () => <div data-testid="carcasa-vieja-dealer-paleta" /> }));

const TENANT = "tenant-qa";
const lote = (permitidas: readonly string[]) => ({
  isError: false, error: null, isPending: false, isLoading: false,
  data: { results: Object.fromEntries(DEALER_NAV_CAPABILITY_KEYS.map((k) => [k, { allowed: permitidas.includes(k) }])) },
});
const sesion = {
  user: { id: "u", email: "dealer@nadakki.test" },
  tenant: { id: "t", display_name: "QA", subscribed_cores: ["credit"] },
  allRoles: [{ core_name: "autos", role_key: "dealer", display_name: "Dealer" }],
  fijarContexto: jest.fn(),
} as unknown as AuthContextValue;

function pintar(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["dealer-context-sync", TENANT], { estado: "sincronizado", assignment: { dealerId: "d-1", organizationUnitId: null, dealerName: "Concesionario QA" } });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={sesion}>{ui}</AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  batchMock.mockReset();
  batchMock.mockReturnValue(lote(DEALER_NAV_CAPABILITY_KEYS.filter((k) => k !== "accounting.reports.financial")));
  contextoDealer.mockReset();
  window.localStorage.clear();
  window.localStorage.setItem("nadakki_tenant_id", TENANT);
});

const sinChromeViejo = () => {
  expect(screen.queryByTestId("carcasa-vieja-dealer-sidebar")).toBeNull();
  expect(screen.queryByTestId("carcasa-vieja-dealer-topbar")).toBeNull();
  expect(screen.queryByTestId("carcasa-vieja-dealer-paleta")).toBeNull();
};

describe("Contabilidad del dealer sobre ModuleShell", () => {
  test.each(["/contable", "/contable/libro-mayor"])("%s, usuario de dealer: una sola barra y el menú del dealer", async (ruta) => {
    pathname = ruta;
    contextoDealer.mockResolvedValue([{ dealerId: "d-1" }]);
    pintar(<AppGate><p>libro mayor</p></AppGate>);
    await waitFor(() => expect(screen.getByTestId("module-shell")).toHaveAttribute("data-modulo", "concesionarios"));
    expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
    expect(screen.queryByTestId("forge-shell")).toBeNull();
    sinChromeViejo();
    expect(screen.getByText("libro mayor")).toBeInTheDocument();
    expect(screen.getByTestId("dealer-acciones")).toBeInTheDocument();
    const menu = within(screen.getByRole("complementary", { name: "Menú de Concesionarios" }));
    const hrefs = menu.getAllByRole("link").map((a) => a.getAttribute("href"));
    // El grupo abierto es el de la pantalla (Finanzas del dealer), como en el resto del módulo.
    expect(hrefs).toEqual(expect.arrayContaining(["/contable", "/contable/libro-mayor"]));
    // El plan sigue mandando: sin reportes financieros no hay Balance.
    expect(hrefs).not.toContain("/contable/balance-comprobacion");
  });

  test("usuario sin asignación de dealer: la Suite como antes, con una sola barra", async () => {
    pathname = "/contable/libro-mayor";
    contextoDealer.mockResolvedValue([]);
    pintar(<AppGate><p>libro mayor</p></AppGate>);
    await waitFor(() => expect(screen.getByTestId("module-shell")).toBeInTheDocument());
    expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
    // PS-9-CARCASAS-3: la Suite es ModuleShell con el menú de su módulo (Contabilidad), no el de Concesionarios.
    expect(screen.getByTestId("module-shell")).not.toHaveAttribute("data-modulo", "concesionarios");
    sinChromeViejo();
  });

  test("mientras verifica, una sola barra y ni un frame de chrome", () => {
    pathname = "/contable/libro-mayor";
    contextoDealer.mockReturnValue(new Promise(() => {}));
    pintar(<AppGate><p>libro mayor</p></AppGate>);
    expect(screen.getByTestId("contable-verificando")).toBeInTheDocument();
    expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
    sinChromeViejo();
  });
});
