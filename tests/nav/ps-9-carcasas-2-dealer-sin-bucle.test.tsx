/**
 * PS-9-CARCASAS-2, regresión de staging (César 20-oct 10:36, #2067): con la sesión DEALER, /autos/dealer se quedaba en
 * «Llevándote a tu panel…» para siempre y /autos/dealer/credito devolvía a /autos/dealer. Causa: ModuleShell envuelve
 * su contenido en DealerSuiteGate (la puerta que saca al dealer de la Suite hacia /autos/dealer) y desde la PARTE 3
 * el propio panel del dealer abre dentro de ModuleShell, así que la puerta lo mandaba a donde ya estaba, en bucle.
 * Aquí la puerta es la REAL (antes se simulaba) con un dealer con asignación.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppGate from "@/components/auth/AppGate";
import DealerLayout from "@/app/autos/dealer/layout";
import CentroOperativoLayout from "@/app/centro-operativo/layout";
import { DEALER_NAV_CAPABILITY_KEYS } from "@/components/dealer-management/shell/dealer-nav";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";

let pathname = "/autos/dealer";
const mockReplace = jest.fn();
const mockContexto = jest.fn();
jest.mock("@/lib/dealer/dealer-context-api", () => ({ ...jest.requireActual("@/lib/dealer/dealer-context-api"), fetchMyDealerContext: () => mockContexto() }));
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  useSelectedLayoutSegments: () => [],
}));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
// DealerSuiteGate REAL: es la puerta que manda al dealer a /autos/dealer (la que se simulaba y escondió el bucle).
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
const lote = {
  isError: false, error: null, isPending: false, isLoading: false,
  data: { results: Object.fromEntries(DEALER_NAV_CAPABILITY_KEYS.map((k) => [k, { allowed: true }])) },
};
const sesion = {
  user: { id: "u-dealer", email: "dealer@nadakki.test" },
  tenant: { id: "t", display_name: "QA", subscribed_cores: ["credit"] },
  allRoles: [{ core_name: "autos", role_key: "dealer", display_name: "Dealer" }],
  fijarContexto: jest.fn(),
} as unknown as AuthContextValue;

function pintar(Layout: typeof DealerLayout, ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["dealer-context-sync", TENANT], { estado: "sincronizado", assignment: { dealerId: "d-1", organizationUnitId: null, dealerName: "Concesionario QA" } });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={sesion}>
        <AppGate><Layout>{ui}</Layout></AppGate>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockReplace.mockReset();
  mockContexto.mockReset();
  mockContexto.mockResolvedValue([{ dealerId: "d-1", organizationUnitId: null }]);
  batchMock.mockReset();
  batchMock.mockReturnValue(lote);
  window.localStorage.clear();
  window.localStorage.setItem("nadakki_tenant_id", TENANT);
});

describe("el panel del dealer no se redirige a sí mismo", () => {
  test.each([
    ["/autos/dealer", DealerLayout],
    ["/autos/dealer/credito", DealerLayout],
    ["/autos/dealer/credito/solicitudes", DealerLayout],
    ["/centro-operativo", CentroOperativoLayout],
  ])("%s con un dealer con asignación: pinta la pantalla, sin «Llevándote a tu panel» ni redirección", async (ruta, Layout) => {
    pathname = ruta;
    pintar(Layout, <p>pantalla del dealer</p>);
    await waitFor(() => expect(screen.getByText("pantalla del dealer")).toBeInTheDocument());
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByTestId("suite-redirigiendo-dealer")).toBeNull();
    expect(screen.queryByTestId("suite-verificando")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalledWith("/autos/dealer");
    expect(screen.getByTestId("module-shell")).toHaveAttribute("data-modulo", "concesionarios");
  });

  test("en la Suite la puerta sigue mandando al dealer a su panel", async () => {
    pathname = "/marketing/campaigns";
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <AuthContext.Provider value={sesion}>
          <AppGate><p>campañas</p></AppGate>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/autos/dealer"));
    expect(screen.queryByText("campañas")).toBeNull();
  });
});
