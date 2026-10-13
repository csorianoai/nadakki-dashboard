/**
 * Pantalla del grupo (tarjetas) y pestañas del grupo (César, 2026-10-13, ajuste al punto 3 de la FASE 1: sin «Más»).
 * Cubre: descripción en cada item de los módulos con ModuleShell, tarjetas = items del grupo, pestañas = items del
 * grupo, pestaña activa por URL (prefijo más largo), flechas solo con desbordamiento y que ningún módulo pierda páginas.
 */
import fs from "fs";
import path from "path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ModuleShell } from "@/components/shell/ModuleShell";
import PantallaGrupo from "@/components/shell/PantallaGrupo";
import { PestanasGrupo } from "@/components/shell/PestanasGrupo";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { DESCRIPCIONES, MAX_DESCRIPCION } from "@/lib/modulos/descripciones";
import { MODULOS, itemActivo, menuVisible, rutaGrupo, tienePantallaGrupo, usaCarcasaComun, type ContextoUsuario } from "@/lib/modulos/registro";
import { migasDe } from "@/lib/migas";
import { NAVEGACION, PESTANAS_MARKETING } from "@/lib/navigation";

let pathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("@/components/dealer/DealerSuiteGate", () => ({ __esModule: true, DealerSuiteGate: ({ children }: { children: React.ReactNode }) => <>{children}</>, isDealerReachableSuitePath: () => false }));
jest.mock("@/components/white-label/TenantBrandedDocumentTitle", () => ({ __esModule: true, TenantBrandedDocumentTitle: () => null }));
jest.mock("@/components/nav/BuscadorNavegacion", () => ({ __esModule: true, EVENTO_ABRIR_BUSCADOR: "nadakki:abrir-buscador", BuscadorNavegacion: () => <div data-testid="buscador" /> }));
jest.mock("@/components/forge/auth/UserMenu", () => ({ __esModule: true, UserMenu: () => <button type="button">Usuario</button> }));
jest.mock("@/components/forge/auth/TenantSwitcher", () => ({ __esModule: true, TenantSwitcher: () => null }));
jest.mock("@/components/forge/layout/ProyectosFinanzasSidebarLinks", () => ({ __esModule: true, ProyectosFinanzasSidebarLinks: () => null }));
jest.mock("@/components/realtor/useRealtorAccess", () => ({ __esModule: true, useRealtorAccess: () => "apagado" }));

const sesion = (role_key: string, cores: string[]) =>
  ({
    user: { id: "u", email: "qa@nadakki.test" },
    tenant: { id: "t", display_name: "QA", subscribed_cores: cores },
    allRoles: [{ core_name: "x", role_key, display_name: role_key }],
  }) as unknown as AuthContextValue;
const SUPER = sesion("platform_superadmin", ["legal", "marketing", "credit"]);
const conSesion = (ui: React.ReactNode) => <AuthContext.Provider value={SUPER}>{ui}</AuthContext.Provider>;
const USUARIO: ContextoUsuario = { roles: SUPER.allRoles, subscribedCores: SUPER.tenant?.subscribed_cores };
const mod = (id: string) => MODULOS.find((m) => m.id === id)!;
const conShell = MODULOS.filter((m) => m.carcasa === "comun");
const hrefs = (xs: { href: string }[]) => xs.map((x) => x.href);

beforeEach(() => { window.localStorage.clear(); });

describe("descripciones: una línea, en español, en cada item de los módulos con ModuleShell", () => {
  test("los módulos con ModuleShell son Marketing, Legal, Proyectos y Administración", () => {
    expect(conShell.map((m) => m.id)).toEqual(["marketing", "legal", "proyectos", "administracion"]);
  });

  test.each(conShell.map((m) => [m.id]))("%s: ningún item sin descripción ni de más de %s caracteres", (id) => {
    const items = mod(id).menu.flatMap((g) => g.items);
    expect(items.length).toBeGreaterThan(0);
    const mal = items.filter((i) => !i.descripcion?.trim() || i.descripcion.length > MAX_DESCRIPCION || /\n/.test(i.descripcion)).map((i) => i.id);
    expect(mal).toEqual([]);
    const genericas = items.filter((i) => /^pantalla de /i.test(i.descripcion!) || i.descripcion!.trim().toLowerCase() === i.label.trim().toLowerCase());
    expect(genericas.map((i) => i.id)).toEqual([]);
  });

  test("no hay descripciones huérfanas (cada clave de descripciones.ts es un item del registro)", () => {
    const ids = new Set(conShell.flatMap((m) => m.menu.flatMap((g) => g.items.map((i) => i.id))));
    expect(Object.keys(DESCRIPCIONES).filter((k) => !ids.has(k))).toEqual([]);
  });
});

describe("pantalla del grupo: /<raíz>/grupo/<id>", () => {
  test("solo Marketing y Administración tienen grupos; Legal y Proyectos (menú plano) no tienen pantalla de grupo", () => {
    expect(conShell.filter((m) => tienePantallaGrupo(m)).map((m) => m.id)).toEqual(["marketing", "administracion"]);
    expect(tienePantallaGrupo(mod("legal"))).toBe(false);
    expect(tienePantallaGrupo(mod("proyectos"))).toBe(false);
  });

  test("cada pantalla de grupo existe como ruta de app/ y no choca con ninguna URL anterior", () => {
    for (const m of conShell.filter((x) => tienePantallaGrupo(x))) {
      expect(fs.existsSync(path.resolve(__dirname, "..", "..", "app", m.raiz.slice(1), "grupo", "[grupo]", "page.tsx"))).toBe(true);
      for (const g of m.menu) {
        const url = rutaGrupo(m, g);
        expect(m.menu.flatMap((x) => x.items).some((i) => i.href === url)).toBe(false);
        expect(usaCarcasaComun(url)).toBe(true);
      }
    }
  });

  test.each([
    ["marketing", "marketing-anuncios", "/marketing-hub/grupo/marketing-anuncios"],
    ["marketing", "marketing-campanas", "/marketing-hub/grupo/marketing-campanas"],
    ["administracion", "admin-cuenta", "/admin/grupo/admin-cuenta"],
    ["administracion", "admin-general", "/admin/grupo/admin-general"],
  ])("%s / %s: tantas tarjetas como items del grupo, con su nombre, descripción y enlace", (modulo, grupoId, url) => {
    pathname = url;
    expect(rutaGrupo(mod(modulo), mod(modulo).menu.find((g) => g.id === grupoId)!)).toBe(url);
    render(conSesion(<PantallaGrupo />));
    const grupo = menuVisible(mod(modulo), USUARIO).find((g) => g.id === grupoId)!;
    const tarjetas = screen.getAllByTestId("tarjeta-pagina");
    expect(tarjetas.map((t) => t.getAttribute("href"))).toEqual(hrefs(grupo.items));
    expect(tarjetas).toHaveLength(grupo.items.length);
    tarjetas.forEach((t, i) => {
      expect(within(t).getByText(grupo.items[i]!.label)).toBeInTheDocument();
      expect(within(t).getByText(grupo.items[i]!.descripcion!)).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(grupo.label);
  });

  test("un grupo que no existe no inventa tarjetas y ofrece volver al módulo", () => {
    pathname = "/marketing-hub/grupo/no-existe";
    render(conSesion(<PantallaGrupo />));
    expect(screen.queryAllByTestId("tarjeta-pagina")).toHaveLength(0);
    expect(screen.getByRole("link", { name: /Volver a Marketing/ })).toHaveAttribute("href", "/marketing-hub");
  });

  test("las tarjetas usan clases del archivo de estilos y no hay 3D (sin perspectiva ni rotaciones)", () => {
    const clases = fs.readFileSync(path.resolve(__dirname, "..", "..", "components", "shell", "clases.ts"), "utf8");
    const tarjeta = /tarjeta: "([^"]+)"/.exec(clases)![1]!;
    expect(tarjeta).toMatch(/hover:-translate-y-0\.5/);
    expect(tarjeta).toMatch(/focus-visible:outline/);
    expect(tarjeta).toMatch(/motion-reduce:/);
    expect(tarjeta).toMatch(/turquesa-modulo/);
    expect(tarjeta).not.toMatch(/perspective|rotate|translate-z|preserve-3d|scale-3d/);
    expect(clases).not.toMatch(/perspective|preserve-3d|translate3d|rotate[XYZ]/);
  });

  test("en la barra lateral, el título del grupo lleva a su pantalla y los items siguen yendo a su página", () => {
    pathname = "/marketing-hub/grupo/marketing-anuncios";
    render(conSesion(<ModuleShell modulo={mod("marketing")}>x</ModuleShell>));
    const menu = screen.getByTestId("menu-modulo");
    expect(within(menu).getByTestId("menu-grupo-enlace-marketing-anuncios")).toHaveAttribute("href", "/marketing-hub/grupo/marketing-anuncios");
    expect(within(menu).getByTestId("menu-grupo-enlace-marketing-anuncios")).toHaveAttribute("aria-current", "page");
    expect(within(menu).getByRole("link", { name: "Google Ads" })).toHaveAttribute("href", "/advertising/google-ads");
    // la pantalla del grupo no marca como activa ninguna página (ni «Resumen de marketing»: /marketing-hub es prefijo de la URL)
    expect(menu.querySelectorAll('ul a[aria-current="page"]')).toHaveLength(0);
    expect(screen.queryByTestId("pestanas-grupo")).toBeNull();
  });
});

describe("migas de la pantalla del grupo", () => {
  test("Inicio › Módulo › Grupo, sin colgar de la página «Resumen» cuyo href es prefijo de la URL", () => {
    expect(migasDe("/marketing-hub/grupo/marketing-anuncios")).toEqual([
      { label: "Inicio", href: "/" },
      { label: "Marketing", href: "/marketing-hub" },
      { label: "Anuncios", href: "/marketing-hub/grupo/marketing-anuncios" },
    ]);
    expect(migasDe("/admin/grupo/admin-cuenta").map((m) => m.label)).toEqual(["Inicio", "Administración", "Cuenta"]);
  });
});

describe("pestañas del grupo", () => {
  test("Marketing: las pestañas son TODAS las páginas del grupo de la URL; la activa viene de la URL", () => {
    pathname = "/advertising/google-ads";
    render(conSesion(<ModuleShell modulo={mod("marketing")}>x</ModuleShell>));
    const barra = screen.getByTestId("pestanas-grupo");
    expect(barra.tagName).toBe("NAV");
    expect(barra).toHaveAccessibleName("Páginas de Anuncios");
    const grupo = menuVisible(mod("marketing"), USUARIO).find((g) => g.id === "marketing-anuncios")!;
    const tabs = within(barra).getAllByTestId("pestana-grupo");
    expect(tabs.map((t) => t.getAttribute("href"))).toEqual(hrefs(grupo.items));
    expect(tabs.filter((t) => t.getAttribute("aria-current") === "page").map((t) => t.textContent)).toEqual(["Google Ads"]);
    expect(screen.queryByTestId("pestanas-marketing")).toBeNull(); // PestanasMarketing ya no se pinta: la sustituyen
  });

  test("la pestaña activa es la de href más largo (Nueva campaña, no Campañas) y las subrutas activan a su página", () => {
    pathname = "/marketing/campaigns/new";
    const { unmount } = render(conSesion(<ModuleShell modulo={mod("marketing")}>x</ModuleShell>));
    expect(screen.getAllByTestId("pestana-grupo").filter((t) => t.hasAttribute("aria-current")).map((t) => t.textContent)).toEqual(["Nueva campaña"]);
    unmount();
    pathname = "/marketing/campaigns/abc-123";
    render(conSesion(<ModuleShell modulo={mod("marketing")}>x</ModuleShell>));
    expect(screen.getAllByTestId("pestana-grupo").filter((t) => t.hasAttribute("aria-current")).map((t) => t.textContent)).toEqual(["Campañas"]);
  });

  test("una ruta de Marketing que no es item del menú sigue mostrando las pestañas de su grupo (como PestanasMarketing)", () => {
    pathname = "/marketing/command-center";
    render(conSesion(<ModuleShell modulo={mod("marketing")}>x</ModuleShell>));
    const grupo = mod("marketing").menu.find((g) => g.id === "marketing-campanas")!;
    expect(screen.getAllByTestId("pestana-grupo").map((t) => t.getAttribute("href"))).toEqual(hrefs(grupo.items));
    expect(screen.getAllByTestId("pestana-grupo").some((t) => t.hasAttribute("aria-current"))).toBe(false);
  });

  test("Administración: pestañas del grupo de la URL", () => {
    pathname = "/billing";
    render(conSesion(<ModuleShell modulo={mod("administracion")}>x</ModuleShell>));
    expect(screen.getByTestId("pestanas-grupo")).toHaveAccessibleName("Páginas de Cuenta");
    expect(screen.getAllByTestId("pestana-grupo").map((t) => t.textContent)).toEqual(["Ajustes", "Integraciones", "Facturación", "Auditoría"]);
    expect(screen.getAllByTestId("pestana-grupo").filter((t) => t.hasAttribute("aria-current")).map((t) => t.textContent)).toEqual(["Facturación"]);
  });

  test.each([["legal", "/legal/cases/new", "Nuevo expediente"], ["proyectos", "/proyectos/dashboards/pm", "Panel del gerente de proyecto"]])(
    "%s (menú plano): las pestañas muestran todas las páginas del módulo",
    (id, url, activa) => {
      pathname = url;
      render(conSesion(<ModuleShell modulo={mod(id)}>x</ModuleShell>));
      const todas = menuVisible(mod(id), USUARIO).flatMap((g) => g.items);
      expect(screen.getAllByTestId("pestana-grupo").map((t) => t.getAttribute("href"))).toEqual(hrefs(todas));
      expect(screen.getAllByTestId("pestana-grupo").filter((t) => t.hasAttribute("aria-current")).map((t) => t.textContent)).toEqual([activa]);
    },
  );
});

describe("flechas de las pestañas: solo si no caben", () => {
  const paginas = mod("marketing").menu[0]!.items;
  let observadores: (() => void)[] = [];
  const medidas = { ancho: 1000, visible: 1000 };
  const original = { sw: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth"), cw: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth") };

  beforeEach(() => {
    observadores = [];
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      constructor(cb: () => void) { observadores.push(cb); }
      observe() {}
      disconnect() {}
    };
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, get() { return (this as HTMLElement).dataset.testid === "pestanas-lista" ? medidas.ancho : 0; } });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get() { return (this as HTMLElement).dataset.testid === "pestanas-lista" ? medidas.visible : 0; } });
  });
  afterEach(() => {
    delete (global as unknown as { ResizeObserver?: unknown }).ResizeObserver;
    for (const [k, d] of [["scrollWidth", original.sw], ["clientWidth", original.cw]] as const) {
      if (d) Object.defineProperty(HTMLElement.prototype, k, d); else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[k];
    }
  });

  test("si caben, no hay flechas; si el ancho disponible se reduce, aparecen; al ensancharse, desaparecen", () => {
    medidas.ancho = 600; medidas.visible = 900;
    render(<PestanasGrupo titulo="Campañas" paginas={paginas} pathname="/marketing/campaigns" />);
    expect(screen.queryByTestId("pestanas-flecha-izq")).toBeNull();
    expect(screen.queryByTestId("pestanas-flecha-der")).toBeNull();

    medidas.ancho = 1400; medidas.visible = 390;                       // móvil: no caben
    act(() => observadores.forEach((cb) => cb()));
    expect(screen.getByTestId("pestanas-flecha-izq")).toBeDisabled();  // al principio no hay nada a la izquierda
    expect(screen.getByTestId("pestanas-flecha-der")).toBeEnabled();

    medidas.visible = 1500;                                            // escritorio ancho: caben otra vez
    act(() => observadores.forEach((cb) => cb()));
    expect(screen.queryByTestId("pestanas-flecha-izq")).toBeNull();
    expect(screen.queryByTestId("pestanas-flecha-der")).toBeNull();
  });

  test("las flechas desplazan por pasos y se desactivan en cada extremo", () => {
    medidas.ancho = 1400; medidas.visible = 400;
    render(<PestanasGrupo titulo="Campañas" paginas={paginas} pathname="/marketing/campaigns" />);
    const lista = screen.getByTestId("pestanas-lista") as HTMLUListElement;
    const scrollBy = jest.fn(({ left }: { left: number }) => { lista.scrollLeft += left; });
    lista.scrollBy = scrollBy as unknown as typeof lista.scrollBy;
    lista.scrollLeft = 0;
    fireEvent.click(screen.getByTestId("pestanas-flecha-der"));
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 320 }));
    fireEvent.scroll(lista);
    expect(screen.getByTestId("pestanas-flecha-izq")).toBeEnabled();
    lista.scrollLeft = 1000;                                           // 1000 + 400 = 1400: final
    fireEvent.scroll(lista);
    expect(screen.getByTestId("pestanas-flecha-der")).toBeDisabled();
    fireEvent.click(screen.getByTestId("pestanas-flecha-izq"));
    expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: -320 }));
  });
});

describe("nada se pierde: ningún módulo pierde páginas respecto a hoy", () => {
  const sec = (id: string) => NAVEGACION.find((s) => s.id === id)!.children.filter((c) => c.href).map((c) => c.href as string);
  const menuHrefs = (id: string) => mod(id).menu.flatMap((g) => g.items.map((i) => i.href));
  /** Lo que mostraba LegalSubNav (barra propia de Legal, sustituida por las pestañas del armazón). */
  const LEGAL_SUBNAV_ANTES = ["/legal", "/legal/cases", "/legal/audiencias", "/legal/research", "/legal/contracts", "/legal/library", "/legal/audit", "/legal/config"];

  test("Marketing: cada página de cada pestaña de PestanasMarketing está en el grupo equivalente (mismo orden)", () => {
    for (const p of PESTANAS_MARKETING) {
      const g = mod("marketing").menu.find((x) => x.id === `marketing-${p.id}`)!;
      expect(hrefs(g.items)).toEqual(p.paginas.map((x) => x.href));
      expect(g.label).toBe(p.label);
    }
    expect(mod("marketing").menu).toHaveLength(PESTANAS_MARKETING.length);
  });

  test.each([["legal", "legal-hub"], ["proyectos", "projects-hub"], ["administracion", "admin"]])("%s: el menú conserva todas las páginas de su sección de lib/navigation.ts", (id, seccion) => {
    expect(menuHrefs(id)).toEqual(expect.arrayContaining(sec(seccion)));
  });

  test("Legal: las pestañas nuevas cubren las 8 de la barra propia anterior (LegalSubNav)", () => {
    expect(menuHrefs("legal")).toEqual(expect.arrayContaining(LEGAL_SUBNAV_ANTES));
  });

  test("por módulo, la unión de las pestañas de todos sus grupos es todo su menú", () => {
    for (const m of conShell) {
      const grupos = menuVisible(m, USUARIO);
      const alcanzables = grupos.flatMap((g) => g.items.map((i) => i.id));
      expect(alcanzables.sort()).toEqual(m.menu.flatMap((g) => g.items.map((i) => i.id)).sort());
      for (const g of grupos) {
        // la página de cada item se resuelve a un item activo del menú (y por tanto a un grupo con su barra de pestañas)
        for (const i of g.items) expect(itemActivo(grupos, i.href)).not.toBeNull();
      }
    }
  });
});
