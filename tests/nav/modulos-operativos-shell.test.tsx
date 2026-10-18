/**
 * PS-11-MODULOS-OPS-B (cierre de la auditoría): lo que el usuario ve de verdad, no solo las funciones puras.
 * (a) tenant_admin: en Administración nada bajo /admin salvo lo suyo; (c) operator sin módulos: ModuleShell de
 * la Suite pinta la pantalla llana y NO el grupo «Elegir módulo».
 */
import fs from "fs";
import path from "path";
import { render, screen, within } from "@testing-library/react";
import { ModuleShell } from "@/components/shell/ModuleShell";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { menuVisible, modulosVisibles } from "@/lib/modulos/registro";

let pathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("@/components/forge/layout/GlobalForgeAppShell", () => ({ __esModule: true, GlobalForgeAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="forge-shell">{children}</div> }));
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

describe("PS-11-MODULOS-OPS-B: lo que se ve", () => {
  it("(a) tenant_admin con cores [platform] y sin 200 de /acceso: bajo /admin solo /admin/usuarios, nunca /admin ni /admin/real-estate", () => {
    const u = { roles: [{ core_name: "platform", role_key: "tenant_admin" }], subscribedCores: ["platform"] };
    const m = modulosVisibles(u).find((x) => x.seccion === "admin")!;
    const bajoAdmin = menuVisible(m, u).flatMap((g) => g.items.map((i) => i.href)).filter((h) => h?.startsWith("/admin"));
    expect(bajoAdmin).toEqual(["/admin/usuarios"]);
  });

  it("(a) la guarda de superadmin de /admin no se relaja: solo /admin/usuarios está eximida en app/admin/layout.tsx", () => {
    const layout = fs.readFileSync(path.resolve(__dirname, "../../app/admin/layout.tsx"), "utf8");
    expect(layout).toMatch(/RUTAS_EXENTAS = \["\/admin\/usuarios"\];/);
  });

  it("(c) operator con cores []: la Suite muestra la pantalla llana y ningún «Elegir módulo»", () => {
    render(conSesion(sesion("operator", []), <ModuleShell modulo={null}><p>contenido-de-portada</p></ModuleShell>));
    const main = screen.getByRole("main");
    expect(within(main).getByTestId("sin-modulos")).toBeInTheDocument();
    expect(main).not.toHaveTextContent("contenido-de-portada");
    expect(screen.queryByText("Elegir módulo")).toBeNull();
  });

  it("(c) operator con cores [credit, legal]: la Suite sí lista módulos y no pinta la pantalla llana", () => {
    render(conSesion(sesion("operator", ["credit", "legal"]), <ModuleShell modulo={null}><p>contenido-de-portada</p></ModuleShell>));
    expect(screen.queryByTestId("sin-modulos")).toBeNull();
    expect(screen.getByRole("main")).toHaveTextContent("contenido-de-portada");
    expect(screen.getAllByText("Elegir módulo").length).toBeGreaterThan(0);
  });
});
