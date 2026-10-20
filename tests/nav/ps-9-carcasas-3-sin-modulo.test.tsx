/**
 * PS-9-CARCASAS-3 PARTE=3/3, criterios (a) y (b): las rutas que hoy caen en el último respaldo de AppGate
 * (GlobalForgeAppShell: /sic, /agents, rutas sin módulo) abren sobre ModuleShell: UNA barra, el menú del registro
 * (lib/modulos, que nace de lib/navigation.ts) y migas de lib/migas. Los portales de Credit Hub con chrome propio
 * (/credit-hub/dealer) siguen con una sola barra, la de MarcoSuite, sin carcasa de la Suite debajo.
 */
import { render, screen, within } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";

let pathname = "/agents";
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
jest.mock("@/components/realtor/useRealtorAccess", () => ({ __esModule: true, useRealtorAccess: () => "apagado" }));
jest.mock("@/components/ai/OnboardingAgent", () => ({ __esModule: true, default: () => null }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));

const sesion = {
  user: { id: "u", email: "qa@nadakki.test" },
  tenant: { id: "t", display_name: "QA", subscribed_cores: ["credit", "legal"] },
  allRoles: [{ core_name: "platform", role_key: "super_admin", display_name: "Superadmin" }],
  fijarContexto: jest.fn(),
} as unknown as AuthContextValue;

const pintar = () => render(<AuthContext.Provider value={sesion}><AppGate><p>pantalla</p></AppGate></AuthContext.Provider>);

describe("rutas sin carcasa propia: ModuleShell, una sola barra", () => {
  test.each([["/agents"], ["/ruta/que/nadie/conoce"], ["/sic"]])("%s", (ruta) => {
    pathname = ruta;
    pintar();
    expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
    expect(screen.getAllByTestId("module-shell")).toHaveLength(1);
    expect(screen.queryByTestId("forge-shell")).toBeNull();
    expect(screen.getByText("pantalla")).toBeInTheDocument();
  });

  test("sin módulo, el menú es el de la Suite del registro: Inicio y elegir módulo", () => {
    pathname = "/agents";
    pintar();
    expect(screen.getByTestId("module-shell")).toHaveAttribute("data-modulo", "suite");
    const menu = within(screen.getByRole("complementary", { name: "Menú de Suite" }));
    expect(menu.getByRole("link", { name: "Inicio", exact: true })).toHaveAttribute("href", "/");
    expect(menu.getByRole("link", { name: "Crédito", exact: true })).toHaveAttribute("href", "/credit-hub");
  });
});

describe("portal de Credit Hub con chrome propio", () => {
  test("/credit-hub/dealer: solo la barra de MarcoSuite, sin menú de la Suite debajo", () => {
    pathname = "/credit-hub/dealer";
    pintar();
    expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
    expect(screen.queryByTestId("module-shell")).toBeNull();
    expect(screen.queryByTestId("forge-shell")).toBeNull();
    expect(screen.getByText("pantalla")).toBeInTheDocument();
  });
});
