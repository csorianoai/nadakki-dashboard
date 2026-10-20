/**
 * PS-9-CARCASAS-2 PARTE=1/7: ModuleShell aplica `capability` (catálogo 097) a los items del menú, como hacía la
 * carcasa propia del dealer (DealerShell): sin permiso explícito no se pinta (fail-closed), y los items sin
 * capability siempre se ven. Además expone useDentroDeModuleShell(), que la parte 2/5 usa para que la carcasa de
 * un core no pinte su propia barra y su propio menú cuando ya la envuelve ModuleShell.
 */
import { render, screen, within } from "@testing-library/react";
import { ModuleShell, useDentroDeModuleShell } from "@/components/shell/ModuleShell";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { MODULOS, type ModuloConfig } from "@/lib/modulos/registro";

let pathname = "/legal/a";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock("@/components/dealer/DealerSuiteGate", () => ({ __esModule: true, DealerSuiteGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("@/components/white-label/TenantBrandedDocumentTitle", () => ({ __esModule: true, TenantBrandedDocumentTitle: () => null }));
jest.mock("@/components/nav/BuscadorNavegacion", () => ({ __esModule: true, EVENTO_ABRIR_BUSCADOR: "nadakki:abrir-buscador", BuscadorNavegacion: () => null }));
jest.mock("@/components/forge/auth/UserMenu", () => ({ __esModule: true, UserMenu: () => null }));
jest.mock("@/components/forge/auth/TenantSwitcher", () => ({ __esModule: true, TenantSwitcher: () => null }));
jest.mock("@/components/forge/layout/ProyectosFinanzasSidebarLinks", () => ({ __esModule: true, ProyectosFinanzasSidebarLinks: () => null }));
jest.mock("@/components/realtor/useRealtorAccess", () => ({ __esModule: true, useRealtorAccess: () => "apagado" }));

type Lote = { isPending?: boolean; isError?: boolean; error?: unknown; data?: { results?: Record<string, { allowed: boolean }> } };
let mockLote: Lote = {};
const mockPedidas: string[][] = [];
jest.mock("@/lib/access/hooks", () => ({
  __esModule: true,
  useAccessEntitlementsBatch: (claves: string[]) => {
    mockPedidas.push(claves);
    return { isPending: false, isLoading: false, isError: false, error: null, ...mockLote };
  },
}));

const sesion = {
  user: { id: "u", email: "qa@nadakki.test" },
  tenant: { id: "t", display_name: "QA", subscribed_cores: ["legal"] },
  allRoles: [{ core_name: "x", role_key: "platform_superadmin", display_name: "S" }],
  fijarContexto: jest.fn(),
} as unknown as AuthContextValue;

const legal = MODULOS.find((m) => m.id === "legal")!;
// Un módulo de carcasa común con items con y sin capability (la forma del menú del dealer, deDealer en lib/modulos).
const conCapacidades: ModuloConfig = {
  ...legal,
  menu: [{ id: "g", label: "Grupo", items: [
    { id: "a", label: "Libre", href: "/legal/a" },
    { id: "b", label: "Inventario", href: "/legal/b", capability: "autos.inventory.list" },
    { id: "c", label: "Leads", href: "/legal/c", capability: "autos.leads.crm" },
  ] }],
};
const enlaces = () => within(screen.getByRole("complementary", { name: "Menú de Legal" })).getAllByRole("link").map((a) => a.getAttribute("href"));
const pinta = (m: ModuloConfig, hijo: React.ReactNode = <p>contenido</p>) =>
  render(<AuthContext.Provider value={sesion}><ModuleShell modulo={m}>{hijo}</ModuleShell></AuthContext.Provider>);

beforeEach(() => { mockLote = {}; mockPedidas.length = 0; pathname = "/legal/a"; });

describe("capability en el menú de ModuleShell", () => {
  test("solo se pintan los items con permiso explícito; los que no llevan capability, siempre", () => {
    mockLote = { data: { results: { "autos.inventory.list": { allowed: true }, "autos.leads.crm": { allowed: false } } } };
    pinta(conCapacidades);
    expect(enlaces()).toEqual(expect.arrayContaining(["/legal/a", "/legal/b"]));
    expect(enlaces()).not.toContain("/legal/c");
    expect(mockPedidas.at(-1)?.slice().sort()).toEqual(["autos.inventory.list", "autos.leads.crm"]);   // una sola petición con sus claves
  });

  test.each([
    ["error del lote", { isError: true, error: new Error("x") }],
    ["lote en vuelo", { isPending: true }],
    ["respuesta sin results", { data: {} }],
  ])("fail-closed (%s): ningún item con capability", (_, lote) => {
    mockLote = lote as Lote;
    pinta(conCapacidades);
    expect(enlaces()).toContain("/legal/a");
    expect(enlaces()).not.toContain("/legal/b");
    expect(enlaces()).not.toContain("/legal/c");
  });

  test("un módulo sin capabilities no pide el lote (los demás módulos no cambian)", () => {
    pinta(legal);
    expect(mockPedidas).toEqual([]);
  });
});

describe("useDentroDeModuleShell", () => {
  function Sonda() {
    return <span data-testid="sonda">{useDentroDeModuleShell() ? "dentro" : "fuera"}</span>;
  }
  test("dentro de ModuleShell es true; fuera, false", () => {
    pinta(legal, <Sonda />);
    expect(screen.getByTestId("sonda")).toHaveTextContent("dentro");
  });
  test("sin ModuleShell es false", () => {
    render(<Sonda />);
    expect(screen.getByTestId("sonda")).toHaveTextContent("fuera");
  });
});
