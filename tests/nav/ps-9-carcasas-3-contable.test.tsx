/**
 * PS-9-CARCASAS-3 PARTE=1/5, prueba integrada: la Contabilidad (/contable/**) para quien NO es dealer abre sobre ModuleShell
 * del módulo Contabilidad (UNA barra, su menú de lib/navigation.ts), no sobre GlobalForgeAppShell. AppGate + ContableChrome
 * REAL + DealerSuiteGate REAL. El dealer sigue en su panel (Concesionarios, PS-9-CARCASAS-2) y, si la consulta del dealer
 * falla, tampoco cae en la carcasa vieja.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppGate from "@/components/auth/AppGate";
import { DEALER_NAV_CAPABILITY_KEYS } from "@/components/dealer-management/shell/dealer-nav";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { MODULOS, usaCarcasaComun } from "@/lib/modulos/registro";
import { NAVEGACION } from "@/lib/navigation";

let pathname = "/contable/libro-mayor";
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSelectedLayoutSegments: () => [],
}));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
// Testigo: si alguien pinta la carcasa vieja de la Suite, aparece.
jest.mock("@/components/forge/layout/GlobalForgeAppShell", () => ({ __esModule: true, GlobalForgeAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="forge-shell">{children}</div> }));
// DealerSuiteGate REAL (lección de nadakki-dashboard#1034): nada de simular la puerta que manda al dealer a su panel.
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
const lote = {
  isError: false, error: null, isPending: false, isLoading: false,
  data: { results: Object.fromEntries(DEALER_NAV_CAPABILITY_KEYS.map((k) => [k, { allowed: true }])) },
};
const sesionCon = (rol: { core_name: string; role_key: string }) =>
  ({
    user: { id: "u-" + rol.role_key, email: "qa@nadakki.test" },
    tenant: { id: "t", display_name: "QA", subscribed_cores: ["contable", "credit"] },
    allRoles: [{ ...rol, display_name: "Rol" }],
    fijarContexto: jest.fn(),
  }) as unknown as AuthContextValue;
const CONTADOR = sesionCon({ core_name: "x", role_key: "platform_superadmin" });
const DEALER = sesionCon({ core_name: "autos", role_key: "dealer" });

function pintar(sesion: AuthContextValue) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["dealer-context-sync", TENANT], { estado: "sincronizado", assignment: { dealerId: "d-1", organizationUnitId: null, dealerName: "Concesionario QA" } });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={sesion}>
        <AppGate><p>libro mayor</p></AppGate>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  batchMock.mockReset();
  batchMock.mockReturnValue(lote);
  contextoDealer.mockReset();
  window.localStorage.clear();
  window.localStorage.setItem("nadakki_tenant_id", TENANT);
  pathname = "/contable/libro-mayor";
});

const unaBarraDeContabilidad = async () => {
  await waitFor(() => expect(screen.getByTestId("module-shell")).toHaveAttribute("data-modulo", "contabilidad"));
  expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
  expect(screen.queryByTestId("forge-shell")).toBeNull();
  expect(screen.getByText("libro mayor")).toBeInTheDocument();
};

describe("Contabilidad para quien no es dealer sobre ModuleShell", () => {
  test.each(["/contable", "/contable/libro-mayor", "/contable/plan-cuentas"])("%s sin asignación de dealer: una sola barra, la del módulo Contabilidad", async (ruta) => {
    pathname = ruta;
    contextoDealer.mockResolvedValue([]);
    pintar(CONTADOR);
    await unaBarraDeContabilidad();
  });

  test("(b) el menú es el de la sección contable-hub de lib/navigation.ts", async () => {
    contextoDealer.mockResolvedValue([]);
    pintar(CONTADOR);
    await unaBarraDeContabilidad();
    const menu = within(screen.getByRole("complementary", { name: "Menú de Contabilidad" }));
    const hrefs = menu.getAllByRole("link").map((a) => a.getAttribute("href"));
    const seccion = NAVEGACION.find((s) => s.id === "contable-hub")!.children.map((c) => c.href).filter(Boolean);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) expect(seccion).toContain(h);
    expect(menu.getByRole("link", { name: /Libro mayor/i })).toHaveAttribute("aria-current", "page");
  });

  test("si la consulta del dealer falla, tampoco cae en la carcasa vieja", async () => {
    contextoDealer.mockRejectedValue(new Error("red"));
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    pintar(CONTADOR);
    await unaBarraDeContabilidad();
  });

  test("el dealer sigue en su panel (Concesionarios), sin redirección ni carcasa vieja", async () => {
    contextoDealer.mockResolvedValue([{ dealerId: "d-1" }]);
    pintar(DEALER);
    await waitFor(() => expect(screen.getByTestId("module-shell")).toHaveAttribute("data-modulo", "concesionarios"));
    expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
    expect(screen.queryByTestId("forge-shell")).toBeNull();
    expect(screen.queryByTestId("suite-redirigiendo-dealer")).toBeNull();
  });

  test("registro: Contabilidad usa la carcasa común, sin pantallas /grupo", () => {
    const m = MODULOS.find((x) => x.id === "contabilidad")!;
    expect(m.carcasa).toBe("comun");
    expect(m.sinPantallaGrupo).toBe(true);
    expect(usaCarcasaComun("/contable/libro-mayor")).toBe(true);
  });
});
