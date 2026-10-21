/**
 * Armazón común (PR 6a): ModuleShell pinta la barra común + el menú del módulo + el hueco de contexto solo para
 * superadmin; un solo desplegable abierto; el menú de la portada sirve para elegir módulo; AppGate lo usa para
 * los módulos migrados y deja como estaban los cores con carcasa propia.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";
import { InicioSuite } from "@/components/shell/InicioSuite";
import { ModuleShell } from "@/components/shell/ModuleShell";
import { SelectorContexto } from "@/components/shell/SelectorContexto";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { MODULOS, menuVisible } from "@/lib/modulos/registro";

let pathname = "/legal/cases/new";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("@/components/dealer/DealerSuiteGate", () => ({ __esModule: true, DealerSuiteGate: ({ children }: { children: React.ReactNode }) => <>{children}</>, isDealerReachableSuitePath: (p: string) => p.startsWith("/contable") }));
jest.mock("@/components/dealer/ContableChrome", () => ({ __esModule: true, ContableChrome: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("@/components/white-label/TenantBrandedDocumentTitle", () => ({ __esModule: true, TenantBrandedDocumentTitle: () => null }));
jest.mock("@/components/nav/BuscadorNavegacion", () => ({ __esModule: true, EVENTO_ABRIR_BUSCADOR: "nadakki:abrir-buscador", BuscadorNavegacion: () => <div data-testid="buscador" /> }));
jest.mock("@/components/forge/auth/UserMenu", () => ({ __esModule: true, UserMenu: () => <button type="button">Usuario</button> }));
jest.mock("@/components/forge/auth/TenantSwitcher", () => ({ __esModule: true, TenantSwitcher: () => null }));
jest.mock("@/components/forge/layout/ProyectosFinanzasSidebarLinks", () => ({ __esModule: true, ProyectosFinanzasSidebarLinks: () => null }));
// PS-9-CARCASAS-2: el menú de Concesionarios lleva capability y ModuleShell pide el lote de acceso (red): aquí, vacío.
jest.mock("@/lib/access/hooks", () => ({ __esModule: true, useAccessEntitlementsBatch: () => ({ isPending: false, isLoading: false, isError: false, error: null, data: { results: {} } }) }));
let mockRealtorAccess = "apagado";
jest.mock("@/components/realtor/useRealtorAccess", () => ({ __esModule: true, useRealtorAccess: () => mockRealtorAccess }));
jest.mock("@/components/ai/OnboardingAgent", () => ({ __esModule: true, default: () => null }));

const sesion = (role_key: string, cores: string[]) =>
  ({
    user: { id: "u", email: "qa@nadakki.test" },
    tenant: { id: "t", display_name: "QA", subscribed_cores: cores },
    allRoles: [{ core_name: "x", role_key, display_name: role_key }],
    fijarContexto: jest.fn(),
  }) as unknown as AuthContextValue;
const conSesion = (v: AuthContextValue, ui: React.ReactNode) => <AuthContext.Provider value={v}>{ui}</AuthContext.Provider>;
const legal = MODULOS.find((m) => m.id === "legal")!;
const marketing = MODULOS.find((m) => m.id === "marketing")!;
const SUPER = sesion("platform_superadmin", ["legal", "marketing", "credit"]);

beforeEach(() => { window.localStorage.clear(); mockRealtorAccess = "apagado"; });

describe("ModuleShell: barra común + menú del módulo + hueco de contexto", () => {
  beforeEach(() => { pathname = "/legal/cases/new"; });

  test("pinta la barra común, el menú del módulo y los landmarks", () => {
    render(conSesion(SUPER, <ModuleShell modulo={legal}><p>contenido</p></ModuleShell>));
    const barra = screen.getByTestId("barra-suite");
    expect(within(barra).getByTestId("barra-suite-logo")).toHaveAttribute("href", "/");
    expect(within(barra).getByTestId("barra-suite-inicio")).toHaveAttribute("href", "/");
    expect(within(barra).getByRole("button", { name: "Atrás" })).toBeInTheDocument();
    expect(within(barra).getByRole("button", { name: "Adelante" })).toBeInTheDocument();
    expect(within(barra).getByTestId("barra-suite-migas")).toBeInTheDocument();
    expect(within(barra).getByRole("button", { name: /Módulos/ })).toBeInTheDocument();
    expect(within(barra).getByRole("button", { name: /Ctrl\+K/ })).toBeInTheDocument();
    expect(within(barra).getByRole("link", { name: "Notificaciones" })).toHaveAttribute("href", "/notifications");
    expect(within(barra).getByRole("button", { name: "Usuario" })).toBeInTheDocument();

    const menu = screen.getByRole("complementary", { name: "Menú de Legal" });
    const enlaces = within(menu).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(enlaces).toEqual(expect.arrayContaining(["/legal", "/legal/cases", "/legal/cases/new", "/legal/contracts"]));
    expect(within(menu).getByRole("navigation", { name: "Navegación de Legal" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("contenido");
    expect(screen.getByTestId("buscador")).toBeInTheDocument();
  });

  test("aria-current solo en el item más específico", () => {
    render(conSesion(SUPER, <ModuleShell modulo={legal}>x</ModuleShell>));
    const actuales = within(screen.getByTestId("menu-modulo")).getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(actuales.map((a) => a.getAttribute("href"))).toEqual(["/legal/cases/new"]);
  });

  test("el hueco de contexto solo existe para platform_superadmin y pinta el selector", () => {
    const { unmount } = render(conSesion(SUPER, <ModuleShell modulo={legal}>x</ModuleShell>));
    expect(within(screen.getByTestId("hueco-contexto")).getByTestId("selector-contexto")).toBeInTheDocument();
    unmount();
    render(conSesion(sesion("tenant_admin", ["legal"]), <ModuleShell modulo={legal}>x</ModuleShell>));
    expect(screen.queryByTestId("hueco-contexto")).toBeNull();
    expect(screen.queryByTestId("selector-contexto")).toBeNull();
  });

  test("SelectorContexto: implementación vacía que no renderiza nada (lo construye otro PR)", () => {
    // Ya implementado: sin platform_superadmin sigue sin renderizar nada (guarda propia del componente).
    const { container } = render(conSesion(sesion("tenant_admin", ["legal"]), <SelectorContexto />));
    expect(container).toBeEmptyDOMElement();
  });

  test("el selector lista solo los módulos visibles y marca el actual", () => {
    render(conSesion(sesion("tenant_admin", ["legal", "marketing"]), <ModuleShell modulo={legal}>x</ModuleShell>));
    fireEvent.click(screen.getByRole("button", { name: /Módulos/ }));
    const lista = screen.getByTestId("selector-modulos-lista");
    expect(within(lista).getAllByRole("link").map((a) => a.textContent)).toEqual(["Marketing", "Legal", "Administración"]);
    expect(within(lista).getByRole("link", { name: "Legal" })).toHaveAttribute("aria-current", "true");
    expect(within(lista).getByRole("link", { name: "Legal" })).toHaveAttribute("href", "/legal");
  });

  test("un solo desplegable abierto: el selector se cierra con Escape, con un clic fuera y al abrir el menú de usuario", () => {
    render(conSesion(SUPER, <ModuleShell modulo={legal}>x</ModuleShell>));
    const abrir = () => fireEvent.click(screen.getByRole("button", { name: /Módulos/ }));
    abrir();
    expect(screen.getByTestId("selector-modulos-lista")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("selector-modulos-lista")).toBeNull();
    abrir();
    fireEvent.mouseDown(screen.getByRole("button", { name: "Usuario" }));
    expect(screen.queryByTestId("selector-modulos-lista")).toBeNull();
    abrir();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId("selector-modulos-lista")).toBeNull();
  });

  test("un solo grupo del menú abierto a la vez", () => {
    pathname = "/marketing/campaigns";
    render(conSesion(SUPER, <ModuleShell modulo={marketing}>x</ModuleShell>));
    const menu = screen.getByTestId("menu-modulo");
    const cabeceras = within(menu).getAllByRole("button").filter((b) => b.hasAttribute("aria-expanded"));
    expect(cabeceras.length).toBeGreaterThan(2);
    const abiertas = () => cabeceras.filter((b) => b.getAttribute("aria-expanded") === "true");
    // Con pantalla de grupo, el título del grupo es un ENLACE y la flecha es el botón que despliega (nombre = aria-label).
    const nombre = (b: HTMLElement) => b.getAttribute("aria-label");
    expect(abiertas().map(nombre)).toEqual(["Plegar las páginas de Campañas"]);
    fireEvent.click(cabeceras[1]);
    expect(abiertas().map(nombre)).toEqual([nombre(cabeceras[1]!)]);
    fireEvent.click(cabeceras[2]);
    expect(abiertas()).toHaveLength(1);
    fireEvent.click(cabeceras[2]);
    expect(abiertas()).toHaveLength(0);
  });

  test("cajón en móvil: el botón lo abre, Escape lo cierra; plegable a iconos", () => {
    render(conSesion(SUPER, <ModuleShell modulo={legal}>x</ModuleShell>));
    expect(screen.queryByTestId("menu-telon")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Abrir el menú del módulo" }));
    expect(screen.getByTestId("menu-telon")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("menu-telon")).toBeNull();
    const menu = screen.getByTestId("menu-modulo");
    expect(menu).toHaveAttribute("data-plegado", "false");
    fireEvent.click(screen.getByRole("button", { name: "Plegar el menú" }));
    expect(menu).toHaveAttribute("data-plegado", "true");
    expect(within(menu).getByRole("link", { name: "Expedientes" })).toHaveAttribute("href", "/legal/cases");
  });

  test("sin sesión (sin AuthProvider) pinta la base sin romper", () => {
    render(<ModuleShell modulo={legal}>x</ModuleShell>);
    expect(screen.getByTestId("barra-suite")).toBeInTheDocument();
    expect(screen.queryByTestId("barra-acciones")).toBeNull();
  });
});

describe("ModuleShell: filas «Pronto» (NavItem.pronto, #837) no se pierden en el armazón", () => {
  const admin = MODULOS.find((m) => m.id === "administracion")!;

  test("Administración en /settings con tenant_admin: «Real Estate» es un enlace, sin marca Pronto (con 200 de /acceso)", () => {
    pathname = "/settings";
    mockRealtorAccess = "ok";
    render(conSesion(sesion("tenant_admin", ["legal"]), <ModuleShell modulo={admin}><p>contenido</p></ModuleShell>));
    const menu = screen.getByRole("complementary", { name: "Menú de Administración" });
    // «Real Estate» está en el grupo «Plataforma»; en /settings el abierto es «Cuenta».
    fireEvent.click(within(menu).getByRole("button", { name: "Plataforma" }));
    const enlace = menu.querySelector('a[href="/admin/real-estate"]');
    expect(enlace).not.toBeNull();
    expect(enlace?.textContent).toContain("Real Estate");
    expect(enlace?.textContent).not.toContain("Pronto");
    expect(menu.querySelector('[data-pronto="/admin/real-estate"]')).toBeNull();
  });

  test("PS-11-MODULOS-OPS-B (3): sin 200 de /acceso el menú de Administración no ofrece «Real Estate»", () => {
    pathname = "/settings";
    render(conSesion(sesion("tenant_admin", ["legal"]), <ModuleShell modulo={admin}><p>contenido</p></ModuleShell>));
    const menu = screen.getByRole("complementary", { name: "Menú de Administración" });
    fireEvent.click(within(menu).getByRole("button", { name: "Plataforma" }));
    expect(menu.querySelector('a[href="/admin/usuarios"]')).not.toBeNull(); // el grupo está abierto
    expect(menu.querySelector('a[href="/admin/real-estate"]')).toBeNull();
    expect(menu.querySelector('[data-pronto="/admin/real-estate"]')).toBeNull();
  });

  test("el registro conserva la fila y menuVisible la oculta a quien no ve Administración", () => {
    const fila = admin.menu.flatMap((g) => g.items).find((i) => i.id === "adm-real-estate");
    expect(fila).toMatchObject({ href: "/admin/real-estate" });
    expect(fila?.pronto).toBeUndefined();
    const filas = (u: Parameters<typeof menuVisible>[1]) => menuVisible(admin, u).flatMap((g) => g.items).map((i) => i.id);
    expect(filas({ roles: [{ core_name: "x", role_key: "tenant_admin", display_name: "t" }], subscribedCores: ["legal"], realtorOk: true } as never)).toContain("adm-real-estate");
    // PS-11-MODULOS-OPS-B (3): sin 200 de /acceso la fila no se ofrece.
    expect(filas({ roles: [{ core_name: "x", role_key: "tenant_admin", display_name: "t" }], subscribedCores: ["legal"] } as never)).not.toContain("adm-real-estate");
    expect(filas({ roles: [{ core_name: "x", role_key: "banker", display_name: "b" }], subscribedCores: ["credit"] } as never)).not.toContain("adm-real-estate");
  });
});

describe("InicioSuite: el menú de la Suite sirve para elegir módulo", () => {
  test("lista los módulos visibles de este usuario", () => {
    pathname = "/";
    render(conSesion(sesion("tenant_admin", ["legal", "credit"]), <InicioSuite>portada</InicioSuite>));
    const menu = screen.getByRole("complementary", { name: "Menú de Suite" });
    const elegir = within(menu).getByTestId("menu-grupo-suite-modulos");
    expect(within(elegir).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/credit-hub", "/legal", "/admin"]);
    expect(within(menu).getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("main")).toHaveTextContent("portada");
    expect(screen.getByTestId("module-shell")).toHaveAttribute("data-modulo", "suite");
  });
});

describe("AppGate: qué rutas usan ModuleShell", () => {
  const modulo = (r: string) => {
    pathname = r;
    const { unmount } = render(conSesion(SUPER, <AppGate>c</AppGate>));
    const out = screen.queryByTestId("module-shell")?.getAttribute("data-modulo") ?? (screen.queryByTestId("forge-shell") ? "global" : "propia");
    unmount();
    return out;
  };
  test.each([
    ["/", "suite"], ["/notifications", "suite"], ["/marketing/campaigns", "marketing"], ["/workflows", "marketing"],
    ["/legal/cases", "legal"], ["/proyectos/portafolio", "proyectos"], ["/admin/gates", "administracion"], ["/settings", "administracion"],
    ["/credit-hub", "credito"], ["/credit-hub/activacion", "credito"], ["/credit/dashboard", "credito"],   // PS-9-CARCASAS-1
    ["/autos/dealer", "concesionarios"], ["/autos/dealer/inventario", "concesionarios"], ["/centro-operativo", "concesionarios"],   // PS-9-CARCASAS-2
    ["/credit-hub/bank-v2", "credito"], ["/credit-hub/bank-v2/solicitudes", "credito"],   // PS-9-CARCASAS-2 PARTE 4/5
  ])("%s -> ModuleShell (%s)", (r, esperado) => expect(modulo(r)).toBe(esperado));

  test.each([["/realtor"], ["/cockpit"], ["/contable/resumen"]])("%s conserva su carcasa propia (solo la barra de MarcoSuite)", (r) => {
    expect(modulo(r)).toBe("propia");
  });

  // PS-9-CARCASAS-3: ya no hay respaldo GlobalForgeAppShell. Sin módulo, la Suite; /credit-hub/dealer, solo la barra.
  test.each([["/sic", "credito"], ["/credit-hub/admin", "credito"], ["/agents", "suite"], ["/ruta/que/nadie/conoce", "suite"]])("%s -> ModuleShell (%s)", (r, esperado) => {
    expect(modulo(r)).toBe(esperado);
  });

  test("/credit-hub/dealer conserva su chrome propio (solo la barra de MarcoSuite)", () => {
    expect(modulo("/credit-hub/dealer")).toBe("propia");
  });
});

test("el menú de Suite conserva enlaces locales con la sesión simulada de CI", () => {
  pathname = "/";
  render(conSesion(SUPER, <ModuleShell modulo={null}><p>contenido</p></ModuleShell>));
  fireEvent.click(screen.getByRole("button", { name: "Abrir el menú del módulo" }));
  const menu = within(screen.getByRole("complementary", { name: "Menú de Suite" }));
  expect(menu.getAllByRole("link").length).toBeGreaterThan(2);
  expect(menu.getByRole("link", { name: "Inicio", exact: true })).toHaveAttribute("href", "/");
  expect(menu.getByRole("link", { name: "Crédito", exact: true })).toHaveAttribute("href", "/credit-hub");
});


// e2e/visual/volver-al-inicio.spec.ts depende de esto: el menú es un acordeón (los grupos plegados se abren por su
// botón aria-controls="grupo-<id>") y el dealer, dentro de ModuleShell, abre el cajón con «Abrir el menú del módulo».
test("Crédito en /credit-hub: abriendo los grupos plegados aparecen más de 2 enlaces; el dealer usa el cajón del armazón", () => {
  pathname = "/credit-hub";
  const credito = MODULOS.find((m) => m.id === "credito")!;
  const { container, unmount } = render(conSesion(SUPER, <ModuleShell modulo={credito}>x</ModuleShell>));
  const menu = screen.getByRole("complementary", { name: /Menú de/ });
  expect(menu.querySelectorAll('a[aria-current="page"]')).toHaveLength(1);
  let enlaces = within(menu).getAllByRole("link").length;
  const plegados = Array.from(menu.querySelectorAll<HTMLButtonElement>('button[aria-controls^="grupo-"][aria-expanded="false"]:not([aria-label])'))
    .map((b) => b.getAttribute("aria-controls")!);
  expect(plegados.length).toBeGreaterThan(0);
  for (const id of plegados) {
    fireEvent.click(menu.querySelector(`button[aria-controls="${id}"]:not([aria-label])`)!);
    enlaces += within(container.querySelector<HTMLElement>(`[id="${id}"]`)!).getAllByRole("link").length;
  }
  expect(enlaces).toBeGreaterThan(2);
  unmount();
  pathname = "/autos/dealer";
  render(conSesion(SUPER, <ModuleShell modulo={MODULOS.find((m) => m.id === "concesionarios")!}>x</ModuleShell>));
  expect(screen.getByRole("button", { name: "Abrir el menú del módulo" })).toBeInTheDocument();
});
