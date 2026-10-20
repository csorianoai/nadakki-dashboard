/**
 * PS-9-CARCASAS-1 (parte 2, layout + BankChShell): Crédito (Credit Hub) abre sobre ModuleShell. (a) una sola barra, sin la carcasa vieja
 * (ChAppShell / ForgeCreditHubAppShell) encima; (b) menú y migas salen de lib/navigation.ts. Dealer, bank-v2 (DccShell),
 * Cockpit de crédito y Monetización conservan su carcasa y NO se tocan en esta parte.
 */
import { render, screen } from "@testing-library/react";
import { BankChShell } from "@/components/credit-hub/bank/BankChShell";
import { CreditHubLayoutClient } from "@/app/(forge)/credit-hub/CreditHubLayoutClient";

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

describe("el layout y el portal banco no pintan carcasa propia", () => {
  test("CreditHubLayoutClient ya no pinta ForgeCreditHubAppShell ni su menú propio (ModuleShell lo da)", () => {
    pathname = "/credit-hub/activacion";
    render(<CreditHubLayoutClient><p>contenido</p></CreditHubLayoutClient>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.queryByTestId("forge-credit-hub-sidebar")).toBeNull();
  });

  test("BankChShell conserva guardas y contenido, pero sin barra ni menú propios (ChAppShell)", () => {
    pathname = "/credit-hub/bank/applications";
    const { container } = render(<BankChShell><p>solicitudes</p></BankChShell>);
    expect(screen.getByText("solicitudes")).toBeInTheDocument();
    expect(container.querySelector(".ch-skip-link")).toBeNull();
    expect(container.querySelector("aside, header, nav")).toBeNull();
    expect(container.querySelector(".credit-hub-forge")).not.toBeNull(); // las variables --ch-* siguen en el contenido
  });
});
