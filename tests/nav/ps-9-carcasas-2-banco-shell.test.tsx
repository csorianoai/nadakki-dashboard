/**
 * PS-9-CARCASAS-2 PARTE=6/7: las pruebas de components/dcc/tests/DccShell.test.tsx, TRASLADADAS al shell que lo sustituye
 * (BancoV2Shell dentro de ModuleShell, por AppGate + layout de Credit Hub + layout de bank-v2) ANTES de borrar DccShell
 * en la PARTE 7/7 (REJECT regla (iv), César 20-oct 11:19): marca y firma, item activo, tema en la raíz, menú móvil, migas
 * y salir, tema recordado con su clave, un solo conmutador con DccPageMarco dentro y el suyo fuera, e item activo por ruta.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { CreditHubLayoutClient } from "@/app/(forge)/credit-hub/CreditHubLayoutClient";
import BancoV2Layout from "@/app/(forge)/credit-hub/bank-v2/layout";
import { BANCO_V2_THEME_STORAGE_KEY } from "@/app/(forge)/credit-hub/bank-v2/BancoV2Shell";
import { marcaDesdeBranding } from "@/lib/dcc/marca";
import { CLASES } from "@/components/shell/clases";
import { DEALER_THEME_STORAGE_KEY } from "@/components/dealer-management/shell/dealer-shell-theme";

let pathname = "/credit-hub/bank-v2/solicitudes";
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
// UserMenu REAL: su «Cerrar sesion» es la salida que daba DccShell.
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
jest.mock("@/lib/hooks/useTenantBranding", () => ({ __esModule: true, useTenantBranding: () => ({ data: { display_name: "Banco Ejemplo", logo_url: null, locale: "es-DO", currency: "DOP" }, isPending: false }) }));
jest.mock("@/lib/credit-hub/hooks/useNotifications", () => ({ __esModule: true, useNotifications: () => ({ items: [], unreadCount: 0, hidden: false, markAsRead: jest.fn() }) }));
jest.mock("@/components/credit-hub/shell/useChromeIdentity", () => ({ __esModule: true, useChromeIdentity: () => ({ name: "QA", initials: "Q", email: "qa@nadakki.test", role: "Banco" }) }));
const mockLogout = jest.fn(async () => undefined);
jest.mock("@/hooks/useAuth", () => ({ __esModule: true, useAuth: () => ({ user: { id: "u", email: "banco@nadakki.test", name: "Laura Méndez" }, activeRole: { role_key: "bank_analyst", display_name: "Analista" }, logout: mockLogout }) }));
jest.mock("@/components/forge/layout/ForgeCreditHubSidebar", () => ({ __esModule: true, ForgeCreditHubSidebar: () => <nav data-testid="forge-credit-hub-sidebar" /> }));

const sesion = {
  user: { id: "u", email: "banco@nadakki.test" },
  tenant: { id: "t", display_name: "QA", subscribed_cores: ["credit"] },
  allRoles: [{ core_name: "credit", role_key: "bank_analyst", display_name: "Analista" }],
  fijarContexto: jest.fn(),
} as unknown as AuthContextValue;

function pintar(ruta: string, hijo: React.ReactNode = <p>pagina</p>) {
  pathname = ruta;
  return render(
    <AuthContext.Provider value={sesion}>
      <AppGate>
        <CreditHubLayoutClient>
          <BancoV2Layout>{hijo}</BancoV2Layout>
        </CreditHubLayoutClient>
      </AppGate>
    </AuthContext.Provider>,
  );
}
const raizBanco = () => screen.getByTestId("banco-acciones").closest("[data-dcc-theme]")!;

beforeEach(() => {
  window.localStorage.clear();
  mockLogout.mockClear();
});

describe("BancoV2Shell en ModuleShell (antes DccShell)", () => {
  it("marca y firma del banco; item activo con aria-current y el acento del módulo", () => {
    pintar("/credit-hub/bank-v2/solicitudes");
    expect(screen.getByTestId("banco-marca")).toHaveTextContent("Banco Ejemplo");
    expect(screen.getByTestId("banco-firma")).toHaveTextContent("con Nadakki Credit Hub");
    const menu = within(screen.getByRole("complementary", { name: "Menú de Crédito" }));
    const activo = menu.getByRole("link", { name: "Bandeja del banco" });
    expect(activo).toHaveAttribute("aria-current", "page");
    expect(activo.className).toContain(CLASES.itemActivo.split(" ")[0]!);
    expect(menu.getByRole("link", { name: "Mesa de decisiones (banco)" })).not.toHaveAttribute("aria-current");
  });

  it("conmuta claro/oscuro en la raíz del banco", () => {
    pintar("/credit-hub/bank-v2");
    expect(raizBanco()).toHaveAttribute("data-dcc-theme", "light");
    fireEvent.click(screen.getByTestId("banco-tema"));
    expect(raizBanco()).toHaveAttribute("data-dcc-theme", "dark");
  });

  it("menú móvil: se abre desde la barra superior y se cierra", () => {
    pintar("/credit-hub/bank-v2");
    const menu = screen.getByRole("complementary", { name: "Menú de Crédito" });
    expect(menu.className).toContain(CLASES.lateralOculto);
    fireEvent.click(screen.getByRole("button", { name: "Abrir el menú del módulo" }));
    expect(menu.className).not.toContain(CLASES.lateralOculto);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar el menú" }));
    expect(menu.className).toContain(CLASES.lateralOculto);
  });

  it("migas: Banco enlaza a la mesa, la última es la página actual; salir cierra la sesión", async () => {
    pintar("/credit-hub/bank-v2/solicitudes");
    const migas = within(screen.getByTestId("barra-suite-migas")).getAllByRole("link");
    expect(migas.find((a) => a.textContent === "Banco")).toHaveAttribute("href", "/credit-hub/bank-v2");
    expect(migas[migas.length - 1]).toHaveAttribute("href", "/credit-hub/bank-v2/solicitudes");
    fireEvent.click(screen.getByRole("button", { name: "User menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesion" }));
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
  });
});

describe("tema recordado y un solo conmutador (banco v2)", () => {
  it("con su clave, el oscuro sobrevive a recargar (nuevo montaje)", () => {
    const primero = pintar("/credit-hub/bank-v2");
    fireEvent.click(screen.getByTestId("banco-tema"));
    expect(window.localStorage.getItem(BANCO_V2_THEME_STORAGE_KEY)).toBe("dark");
    primero.unmount();
    pintar("/credit-hub/bank-v2");
    expect(raizBanco()).toHaveAttribute("data-dcc-theme", "dark");
  });

  it("solo escribe SU clave de tema: ni la del dealer ni otra", () => {
    pintar("/credit-hub/bank-v2");
    fireEvent.click(screen.getByTestId("banco-tema"));
    const temas = Object.keys(window.localStorage).filter((k) => k.includes("theme") || k.includes("tema"));
    expect(temas).toEqual([BANCO_V2_THEME_STORAGE_KEY]);
    expect(window.localStorage.getItem(DEALER_THEME_STORAGE_KEY)).toBeNull();
  });

  it("dentro del shell la página no repite el conmutador; el del banco manda en ambas", () => {
    const { container } = pintar(
      "/credit-hub/bank-v2",
      <DccPageMarco titulo="Mesa" marca={marcaDesdeBranding(null, "banco")}>
        <p>pagina</p>
      </DccPageMarco>,
    );
    expect(screen.queryByTestId("dcc-theme-toggle")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Cambiar a tema oscuro" })).toHaveLength(1);
    fireEvent.click(screen.getByTestId("banco-tema"));
    expect(container.querySelector("[data-dcc-root]")).toHaveAttribute("data-dcc-theme", "dark");
  });

  it("fuera del shell la página conserva su conmutador (sin cambios)", () => {
    render(
      <DccPageMarco titulo="Mesa" marca={marcaDesdeBranding(null, "banco")}>
        <p>pagina</p>
      </DccPageMarco>,
    );
    expect(screen.getByTestId("dcc-theme-toggle")).toBeInTheDocument();
  });
});

describe("item activo por ruta (antes itemActivo de DccShell)", () => {
  it.each([
    ["/credit-hub/bank-v2", "Mesa de decisiones (banco)"],
    ["/credit-hub/bank-v2/solicitudes/abc", "Bandeja del banco"],
    ["/credit-hub/bank-v2/kpis", "Indicadores del banco"],
  ])("%s: activo «%s» y solo él", (ruta, label) => {
    pintar(ruta);
    const menu = within(screen.getByRole("complementary", { name: "Menú de Crédito" }));
    const activos = menu.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(activos.map((a) => a.textContent)).toEqual([label]);
  });
});
