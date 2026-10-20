/** PS-11-MODULOS-OPS-B: la pantalla llana solo sustituye la portada; /notifications (también sirve ModuleShell modulo=null) conserva su contenido. */
import { render, screen, within } from "@testing-library/react";
import { ModuleShell } from "@/components/shell/ModuleShell";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";

let pathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("@/components/dealer/DealerSuiteGate", () => ({ __esModule: true, DealerSuiteGate: ({ children }: { children: React.ReactNode }) => <>{children}</>, isDealerReachableSuitePath: (p: string) => p.startsWith("/contable") }));
jest.mock("@/components/dealer/ContableChrome", () => ({ __esModule: true, ContableChrome: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("@/components/white-label/TenantBrandedDocumentTitle", () => ({ __esModule: true, TenantBrandedDocumentTitle: () => null }));
jest.mock("@/components/nav/BuscadorNavegacion", () => ({ __esModule: true, EVENTO_ABRIR_BUSCADOR: "nadakki:abrir-buscador", BuscadorNavegacion: () => <div data-testid="buscador" /> }));
jest.mock("@/components/forge/auth/UserMenu", () => ({ __esModule: true, UserMenu: () => <button type="button">Usuario</button> }));
jest.mock("@/components/forge/auth/TenantSwitcher", () => ({ __esModule: true, TenantSwitcher: () => null }));
jest.mock("@/components/forge/layout/ProyectosFinanzasSidebarLinks", () => ({ __esModule: true, ProyectosFinanzasSidebarLinks: () => null }));
jest.mock("@/components/realtor/useRealtorAccess", () => ({ __esModule: true, useRealtorAccess: () => "apagado" }));
jest.mock("@/components/ai/OnboardingAgent", () => ({ __esModule: true, default: () => null }));

const sesion = (role_key: string, cores: string[]) =>
  ({
    user: { id: "u", email: "qa@nadakki.test" },
    tenant: { id: "t", display_name: "QA", subscribed_cores: cores },
    allRoles: [{ core_name: "x", role_key, display_name: role_key }],
    fijarContexto: jest.fn(),
  }) as unknown as AuthContextValue;
const conSesion = (v: AuthContextValue, ui: React.ReactNode) => <AuthContext.Provider value={v}>{ui}</AuthContext.Provider>;

describe("PS-11-MODULOS-OPS-B: /notifications sin módulos", () => {
  it("operator con cores []: en /notifications se pintan los children, no la pantalla llana", () => {
    pathname = "/notifications";
    render(conSesion(sesion("operator", []), <ModuleShell modulo={null}><p>bandeja-notificaciones</p></ModuleShell>));
    expect(screen.queryByTestId("sin-modulos")).toBeNull();
    expect(within(screen.getByRole("main")).getByText("bandeja-notificaciones")).toBeInTheDocument();
  });

  it("operator con cores []: en la portada «/» sigue la pantalla llana", () => {
    pathname = "/";
    render(conSesion(sesion("operator", []), <ModuleShell modulo={null}><p>portada</p></ModuleShell>));
    expect(within(screen.getByRole("main")).getByTestId("sin-modulos")).toBeInTheDocument();
  });
});
