/**
 * PS-9-CARCASAS-2 PARTE=4/5, prueba integrada: el panel del banco (/credit-hub/bank-v2/**) abre sobre ModuleShell.
 * AppGate + el layout REAL de Credit Hub + el de bank-v2 (BancoV2Shell) = UNA sola barra (la del armazón común), el
 * menú del módulo Crédito sacado de lib/navigation.ts (con todas las pantallas del banco, también Escalaciones) y sin
 * el menú ni la barra de DccShell; el buscador, la campana y el tema del banco siguen a la vista, en el contenido.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { CreditHubLayoutClient } from "@/app/(forge)/credit-hub/CreditHubLayoutClient";
import BancoV2Layout from "@/app/(forge)/credit-hub/bank-v2/layout";
import { BANCO_V2_NAV } from "@/app/(forge)/credit-hub/bank-v2/_nav";
import { useMarcaBanco } from "@/app/(forge)/credit-hub/bank-v2/BancoV2Shell";
import { NAVEGACION } from "@/lib/navigation";
import { usaCarcasaComun } from "@/lib/modulos/registro";

let pathname = "/credit-hub/bank-v2/solicitudes";
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
jest.mock("@/lib/credit-hub/hooks/useNotifications", () => ({ __esModule: true, useNotifications: () => ({ items: [], unreadCount: 0, hidden: false, markAsRead: jest.fn() }) }));
jest.mock("@/components/credit-hub/shell/useChromeIdentity", () => ({ __esModule: true, useChromeIdentity: () => ({ name: "QA", initials: "Q", email: "qa@nadakki.test", role: "Banco" }) }));
jest.mock("@/hooks/useAuth", () => ({ __esModule: true, useAuth: () => ({ logout: jest.fn() }) }));
jest.mock("@/components/forge/layout/ForgeCreditHubSidebar", () => ({ __esModule: true, ForgeCreditHubSidebar: () => <nav data-testid="forge-credit-hub-sidebar" /> }));
// Testigos de lo que NO debe aparecer: el menú y la barra propios de DccShell.
jest.mock("@/components/dcc/shell/DccShellSidebar", () => ({ __esModule: true, DccShellSidebar: () => <nav data-testid="carcasa-vieja-dcc-sidebar" /> }));
jest.mock("@/components/dcc/shell/DccShellTopbar", () => ({ __esModule: true, DccShellTopbar: () => <header data-testid="carcasa-vieja-dcc-topbar" /> }));

// Un analista del banco (rol bank*), no superadmin: el menú de Crédito se filtra por rol.
const sesion = {
  user: { id: "u", email: "banco@nadakki.test" },
  tenant: { id: "t", display_name: "QA", subscribed_cores: ["credit"] },
  allRoles: [{ core_name: "credit", role_key: "bank_analyst", display_name: "Analista" }],
  fijarContexto: jest.fn(),
} as unknown as AuthContextValue;

function MarcaVisible() {
  return <p data-testid="marca-banco">{useMarcaBanco().nombre ?? "sin nombre"}</p>;
}

function pintar() {
  return render(
    <AuthContext.Provider value={sesion}>
      <AppGate>
        <CreditHubLayoutClient>
          <BancoV2Layout>
            <p>pantalla del banco</p>
            <MarcaVisible />
          </BancoV2Layout>
        </CreditHubLayoutClient>
      </AppGate>
    </AuthContext.Provider>,
  );
}

beforeEach(() => window.localStorage.clear());

describe("bank-v2 sobre ModuleShell", () => {
  test.each(["/credit-hub/bank-v2", "/credit-hub/bank-v2/solicitudes", "/credit-hub/bank-v2/escalaciones"])("%s: una sola barra, la del armazón común", (ruta) => {
    pathname = ruta;
    pintar();
    expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
    expect(screen.getByTestId("module-shell")).toHaveAttribute("data-modulo", "credito");
    expect(screen.queryByTestId("forge-shell")).toBeNull();
    expect(screen.queryByTestId("carcasa-vieja-dcc-sidebar")).toBeNull();
    expect(screen.queryByTestId("carcasa-vieja-dcc-topbar")).toBeNull();
    expect(screen.getByText("pantalla del banco")).toBeInTheDocument();
    expect(screen.getByTestId("marca-banco")).toBeInTheDocument();
  });

  test("el buscador, la campana y el tema del banco siguen, en el contenido", () => {
    pathname = "/credit-hub/bank-v2/solicitudes";
    pintar();
    const acciones = within(screen.getByTestId("banco-acciones"));
    expect(acciones.getByTestId("banco-buscador")).toBeInTheDocument();
    expect(acciones.getByTestId("banco-campana")).toBeInTheDocument();
    const tema = acciones.getByTestId("banco-tema");
    expect(tema).toHaveAttribute("aria-label", "Cambiar a tema oscuro");
    fireEvent.click(tema);
    expect(screen.getByTestId("banco-acciones").closest("[data-dcc-theme]")).toHaveAttribute("data-dcc-theme", "dark");
    expect(window.localStorage.getItem("nadakki-banco-v2-theme")).toBe("dark");
  });

  test("(b) el menú es el de Crédito, de lib/navigation.ts, con todas sus pantallas del banco", () => {
    pathname = "/credit-hub/bank-v2/solicitudes";
    pintar();
    const menu = within(screen.getByRole("complementary", { name: "Menú de Crédito" }));
    const hrefs = menu.getAllByRole("link").map((a) => a.getAttribute("href") ?? "");
    const seccion = NAVEGACION.find((s) => s.id === "credit-hub")!;
    const delBanco = seccion.children.map((i) => i.href ?? "").filter((h) => h.startsWith("/credit-hub/bank-v2"));
    expect(delBanco.length).toBeGreaterThan(0);
    expect(hrefs.filter((h) => h.startsWith("/credit-hub/bank-v2")).sort()).toEqual([...delBanco].sort());
  });

  test("el menú marca como activa la pantalla en curso (Bandeja del banco)", () => {
    pathname = "/credit-hub/bank-v2/solicitudes";
    pintar();
    const menu = within(screen.getByRole("complementary", { name: "Menú de Crédito" }));
    expect(menu.getByRole("link", { name: "Bandeja del banco" })).toHaveAttribute("aria-current", "page");
    expect(menu.getByRole("link", { name: "Mesa de decisiones (banco)" })).not.toHaveAttribute("aria-current");
  });

  test("lo que DccShell enlazaba y lib/navigation.ts no lista (Escalaciones) sigue en el buscador del banco", () => {
    pathname = "/credit-hub/bank-v2/solicitudes";
    pintar();
    const seccion = NAVEGACION.find((s) => s.id === "credit-hub")!;
    const fuera = BANCO_V2_NAV.flatMap((g) => g.items).filter((i) => !seccion.children.some((c) => c.href === i.href));
    expect(fuera.map((i) => i.href)).toEqual(["/credit-hub/bank-v2/escalaciones"]);
    fireEvent.click(screen.getByTestId("banco-buscador"));
    const dialogo = within(screen.getByTestId("banco-buscador-dialogo"));
    for (const i of fuera) expect(dialogo.getByText(i.label)).toBeInTheDocument();
  });

  test("registro: bank-v2 ya no es carcasa propia", () => {
    for (const r of ["/credit-hub/bank-v2", "/credit-hub/bank-v2/solicitudes/x"]) expect(usaCarcasaComun(r)).toBe(true);
  });
});
