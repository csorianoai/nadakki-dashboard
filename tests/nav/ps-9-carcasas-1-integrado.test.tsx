/**
 * PS-9-CARCASAS-1, prueba integrada (decisión de César, 20-oct): la ruta completa de Crédito —AppGate, el layout real
 * de Credit Hub y, en el portal banco, BankChShell— pinta UNA sola barra, la de ModuleShell del módulo crédito, y
 * ninguna carcasa vieja (ForgeCreditHubAppShell, ChAppShell). Falla si falta la migración de AppGate y el registro
 * (sin ModuleShell) o la del layout y BankChShell (la carcasa vieja sigue debajo). RESULT_PS_9_CARCASAS_1 depende de ella.
 */
import { render, screen } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { CreditHubLayoutClient } from "@/app/(forge)/credit-hub/CreditHubLayoutClient";
import { BankChShell } from "@/components/credit-hub/bank/BankChShell";

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
// Testigos de las carcasas viejas: si alguien las pinta, aparecen en el DOM.
jest.mock("@/components/forge/layout/ForgeCreditHubAppShell", () => ({ __esModule: true, ForgeCreditHubAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="carcasa-vieja-forge-credit-hub">{children}</div> }));
jest.mock("@/components/credit-hub/shell/ChAppShell", () => ({ __esModule: true, ChAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="carcasa-vieja-ch-app-shell">{children}</div> }));


const unaSolaBarraDeCredito = () => {
  expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
  expect(screen.getByTestId("module-shell")).toHaveAttribute("data-modulo", "credito");
  expect(screen.getByRole("complementary", { name: "Menú de Crédito" })).toBeInTheDocument();
  expect(screen.queryByTestId("forge-shell")).toBeNull();
  expect(screen.queryByTestId("carcasa-vieja-forge-credit-hub")).toBeNull();
  expect(screen.queryByTestId("carcasa-vieja-ch-app-shell")).toBeNull();
  expect(screen.queryByTestId("forge-credit-hub-sidebar")).toBeNull();
};

describe("Crédito de punta a punta: AppGate + layout de Credit Hub (+ BankChShell) = una sola barra, la de ModuleShell", () => {
  test.each(["/credit-hub", "/credit-hub/activacion"])("%s", (ruta) => {
    pathname = ruta;
    render(conSesion(<AppGate><CreditHubLayoutClient><p>pantalla</p></CreditHubLayoutClient></AppGate>));
    expect(screen.getByText("pantalla")).toBeInTheDocument();
    unaSolaBarraDeCredito();
  });

  test("/credit-hub/bank/applications (portal banco con BankChShell)", () => {
    pathname = "/credit-hub/bank/applications";
    render(conSesion(<AppGate><CreditHubLayoutClient><BankChShell><p>solicitudes</p></BankChShell></CreditHubLayoutClient></AppGate>));
    expect(screen.getByText("solicitudes")).toBeInTheDocument();
    unaSolaBarraDeCredito();
  });
});
