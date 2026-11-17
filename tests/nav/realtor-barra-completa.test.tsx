/**
 * ROP-UX-TOPBAR (César, 2026-10-27): /realtor lleva la barra COMÚN de la Suite (ModuleTopBar), no la básica. Con sesión trae el
 * buscador Ctrl+K, las notificaciones, el selector de tenant y el menú de usuario, igual que el resto de módulos. Se reutilizan
 * los componentes existentes (ModuleTopBar, BuscadorNavegacion); Realtor conserva su propia barra lateral y no recibe la genérica.
 */
import { render, screen, within } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";

let pathname = "/realtor/mi-dia";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div> }));
jest.mock("@/components/dealer/DealerSuiteGate", () => ({ __esModule: true, DealerSuiteGate: ({ children }: { children: React.ReactNode }) => <>{children}</>, isDealerReachableSuitePath: () => false }));
jest.mock("@/components/white-label/TenantBrandedDocumentTitle", () => ({ __esModule: true, TenantBrandedDocumentTitle: () => null }));
jest.mock("@/components/nav/BuscadorNavegacion", () => ({ __esModule: true, EVENTO_ABRIR_BUSCADOR: "nadakki:abrir-buscador", BuscadorNavegacion: () => <div data-testid="buscador" /> }));
jest.mock("@/components/forge/auth/UserMenu", () => ({ __esModule: true, UserMenu: () => <button type="button" data-testid="user-menu">César Soriano</button> }));
jest.mock("@/components/forge/auth/TenantSwitcher", () => ({ __esModule: true, TenantSwitcher: () => <div data-testid="tenant-switcher">Soriano Realty</div> }));
jest.mock("@/components/forge/layout/ProyectosFinanzasSidebarLinks", () => ({ __esModule: true, ProyectosFinanzasSidebarLinks: () => null }));
jest.mock("@/components/realtor/useRealtorAccess", () => ({ __esModule: true, useRealtorAccess: () => "ok" }));
jest.mock("@/components/ai/OnboardingAgent", () => ({ __esModule: true, default: () => <div data-testid="bot-widget" /> }));

const AGENTE = {
  user: { id: "u1", email: "cesar@nadakki.com" },
  tenant: { id: "t1", display_name: "Soriano Realty", subscribed_cores: ["real_estate"] },
  allRoles: [{ core_name: "real_estate", role_key: "agent", display_name: "Agente" }],
} as unknown as AuthContextValue;
const conSesion = (ui: React.ReactNode) => <AuthContext.Provider value={AGENTE}>{ui}</AuthContext.Provider>;

describe("negativos primero", () => {
  it("sin sesión (sin AuthProvider) /realtor solo pinta la base: sin acciones ni buscador", () => {
    pathname = "/realtor/mi-dia";
    render(<AppGate>contenido</AppGate>);
    expect(screen.getByTestId("barra-suite")).toBeInTheDocument();
    expect(screen.queryByTestId("barra-acciones")).toBeNull();
    expect(screen.queryByTestId("buscador")).toBeNull();
  });
  it("Realtor no recibe el menú lateral genérico, ni el botón de cajón del módulo, ni el asistente", () => {
    pathname = "/realtor/smart-calendar";
    render(conSesion(<AppGate>contenido</AppGate>));
    expect(screen.queryByTestId("module-shell")).toBeNull();
    expect(screen.queryByRole("button", { name: "Abrir el menú del módulo" })).toBeNull();
    expect(screen.queryByTestId("bot-widget")).toBeNull();
    expect(screen.getByTestId("protected")).toBeInTheDocument();
  });
  it("/realtors (solo empieza por la palabra) sigue en el armazón común", () => {
    pathname = "/realtors";
    render(conSesion(<AppGate>otra</AppGate>));
    expect(screen.getByTestId("module-shell")).toBeInTheDocument();
  });
});

describe("positivo: la barra completa también en /realtor", () => {
  it.each(["/realtor", "/realtor/mi-dia", "/realtor/smart-calendar", "/realtor/property-intel"])("%s", (p) => {
    pathname = p;
    render(conSesion(<AppGate>contenido de Realtor</AppGate>));
    expect(screen.getByText("contenido de Realtor")).toBeInTheDocument();
    const acciones = screen.getByTestId("barra-acciones");
    expect(within(acciones).getByRole("button", { name: "Buscar una pantalla (Ctrl+K)" })).toBeInTheDocument();
    expect(within(acciones).getByRole("link", { name: "Notificaciones" })).toHaveAttribute("href", "/notifications");
    expect(within(acciones).getByTestId("tenant-switcher")).toBeInTheDocument();
    expect(within(acciones).getByTestId("user-menu")).toBeInTheDocument();
    // El buscador Ctrl+K está montado (escucha el atajo y el botón de la barra).
    expect(screen.getByTestId("buscador")).toBeInTheDocument();
    // Una sola barra de la Suite.
    expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
  });
});
