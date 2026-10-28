/**
 * ROP-UX-NAV-MOVIL-BARRA (captura a 390 px de /realtor con sesión): la barra COMÚN (BarraSuite + ModuleTopBar, la de todos
 * los módulos) no cabía: el menú de usuario quedaba cortado por la derecha, el selector de tenant desaparecía (`hidden md:block`
 * sin otra vía), las migas quedaban pegadas al borde superior y Atrás/Adelante no tenían borde (contraste 0, WCAG 1.4.11).
 *
 * jsdom no tiene layout: aquí se prueba la ESTRUCTURA (clases responsive, el menú «Más» con el selector de tenant en móvil,
 * migas reducidas a la última en móvil, aria-label en botones de icono, clases de alineación y de foco). La medida real a
 * 390/768/1280 px (nada sale del viewport, sin scroll horizontal) está en e2e/visual/barra-movil.spec.ts (necesita build).
 */
import fs from "fs";
import path from "path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";
import { BarraSuite } from "@/components/nav/BarraSuite";
import { ModuleShell } from "@/components/shell/ModuleShell";
import { ModuleTopBar } from "@/components/shell/ModuleTopBar";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { MODULOS } from "@/lib/modulos/registro";

let pathname = "/realtor/clientes";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({ __esModule: true, ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("@/components/dealer/DealerSuiteGate", () => ({ __esModule: true, DealerSuiteGate: ({ children }: { children: React.ReactNode }) => <>{children}</>, isDealerReachableSuitePath: () => false }));
jest.mock("@/components/white-label/TenantBrandedDocumentTitle", () => ({ __esModule: true, TenantBrandedDocumentTitle: () => null }));
jest.mock("@/components/nav/BuscadorNavegacion", () => ({ __esModule: true, EVENTO_ABRIR_BUSCADOR: "nadakki:abrir-buscador", BuscadorNavegacion: () => null }));
jest.mock("@/components/forge/auth/UserMenu", () => ({ __esModule: true, UserMenu: () => <div><button type="button" data-testid="user-menu" aria-label="User menu">CS</button></div> }));
jest.mock("@/components/forge/auth/TenantSwitcher", () => ({ __esModule: true, TenantSwitcher: () => <div data-testid="tenant-switcher">Soriano Realty</div> }));
jest.mock("@/components/forge/layout/ProyectosFinanzasSidebarLinks", () => ({ __esModule: true, ProyectosFinanzasSidebarLinks: () => null }));
jest.mock("@/components/realtor/useRealtorAccess", () => ({ __esModule: true, useRealtorAccess: () => "ok" }));
jest.mock("@/components/ai/OnboardingAgent", () => ({ __esModule: true, default: () => null }));

const sesion = (role_key: string, conTenant = true) =>
  ({
    user: { id: "u1", email: "cesar.soriano@sorianorealty.com" },
    tenant: conTenant ? { id: "t1", display_name: "Soriano Realty", subscribed_cores: ["real_estate"] } : null,
    allRoles: [{ core_name: role_key === "platform_superadmin" ? "platform" : "real_estate", role_key, display_name: role_key }],
    fijarContexto: jest.fn(),
  }) as unknown as AuthContextValue;
const AGENTE = sesion("agent");
const SUPER = sesion("platform_superadmin");
const con = (v: AuthContextValue, ui: React.ReactNode) => <AuthContext.Provider value={v}>{ui}</AuthContext.Provider>;
const barra = (v: AuthContextValue, esSuperadmin = false) =>
  con(v, <ModuleTopBar modulos={MODULOS.slice(0, 2)} actual="real-estate" conSesion esSuperadmin={esSuperadmin} />);
const clases = (el: Element | null) => (el?.getAttribute("class") ?? "").split(/\s+/);
const MAS = { name: "Más opciones de la barra" };

beforeEach(() => {
  pathname = "/realtor/clientes";
  Object.defineProperty(globalThis, "navigation", { configurable: true, value: undefined });
});

describe("negativos primero", () => {
  it("sin sesión /realtor solo lleva la base: ni acciones, ni menú «Más», ni selector de tenant", () => {
    render(<AppGate>contenido</AppGate>);
    expect(screen.getByTestId("barra-suite")).toBeInTheDocument();
    expect(screen.queryByTestId("barra-acciones")).toBeNull();
    expect(screen.queryByRole("button", MAS)).toBeNull();
    expect(screen.queryByTestId("tenant-switcher")).toBeNull();
  });

  it("con sesión pero sin tenant y sin superadmin: «Más» solo por debajo de md y solo con Notificaciones (nunca vacío)", () => {
    render(barra(sesion("agent", false)));
    expect(screen.getByTestId("barra-acciones")).toBeInTheDocument();
    const mas = screen.getByRole("button", MAS);
    expect(clases(mas.parentElement)).toContain("md:hidden");
    fireEvent.click(mas);
    const panel = screen.getByTestId("barra-mas-panel");
    expect(within(panel).getByRole("link", { name: "Notificaciones" })).toHaveAttribute("href", "/notifications");
    // (TenantSwitcher está simulado en este archivo; el real devuelve null sin tenant.)
  });

  it("un agente no recibe el selector Empresa/Vista ni en la barra ni dentro de «Más»", () => {
    render(barra(AGENTE));
    fireEvent.click(screen.getByRole("button", MAS));
    expect(screen.queryByTestId("hueco-contexto")).toBeNull();
    expect(screen.queryByTestId("selector-contexto")).toBeNull();
  });
});

describe("móvil: el selector de tenant (y el de contexto del superadmin) siguen alcanzables por «Más»", () => {
  it("«Más» solo se ve por debajo de lg, tiene aria-label y aria-expanded, y abre un panel con el selector de tenant", () => {
    render(barra(AGENTE));
    const mas = screen.getByRole("button", MAS);
    expect(clases(mas.parentElement)).toContain("lg:hidden");
    expect(mas).toHaveAttribute("aria-expanded", "false");
    expect(mas).toHaveAttribute("aria-haspopup", "true");
    expect(clases(mas)).toContain("focus-visible:outline");
    fireEvent.click(mas);
    expect(mas).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByTestId("barra-mas-panel");
    expect(mas).toHaveAttribute("aria-controls", panel.id);
    // «Más» está en el borde derecho: entre md y lg el panel se ancla a la derecha (a 768 px, anclado a la izquierda llegaba a 817).
    expect(clases(panel)).toEqual(expect.arrayContaining(["md:left-auto", "md:right-0"]));
    expect(within(panel).getByTestId("tenant-switcher")).toHaveTextContent("Soriano Realty");
  });

  it("«Más» se cierra con Escape (devolviendo el foco) y con un clic fuera", () => {
    render(barra(AGENTE));
    const mas = screen.getByRole("button", MAS);
    fireEvent.click(mas);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("barra-mas-panel")).toBeNull();
    expect(mas).toHaveFocus();
    fireEvent.click(mas);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId("barra-mas-panel")).toBeNull();
  });

  it("desde lg el selector de tenant sigue en la barra (hidden lg:block) y el hueco de contexto también se oculta por debajo", () => {
    render(barra(SUPER, true));
    const acciones = screen.getByTestId("barra-acciones");
    const slot = within(acciones).getByTestId("tenant-switcher").parentElement;
    expect(clases(slot)).toEqual(expect.arrayContaining(["hidden", "lg:block"]));
    expect(clases(screen.getByTestId("hueco-contexto"))).toEqual(expect.arrayContaining(["hidden", "lg:block"]));
  });

  it("superadmin: dentro de «Más» también está su selector Empresa/Vista, fuera del hueco (que sigue siendo uno)", () => {
    render(barra(SUPER, true));
    fireEvent.click(screen.getByRole("button", MAS));
    const panel = screen.getByTestId("barra-mas-panel");
    expect(within(panel).getByTestId("selector-contexto")).toBeInTheDocument();
    expect(within(panel).queryByTestId("hueco-contexto")).toBeNull();
    expect(screen.getAllByTestId("hueco-contexto")).toHaveLength(1);
  });
});

describe("cabe a 390 px: elementos compactos y que no encogen", () => {
  // Medido a 390 px: con el logotipo y «Inicio» (los dos llevan al mismo Inicio) la última miga se quedaba en 2 px en los
  // módulos de ModuleShell. Por debajo de sm queda el logotipo («Nadakki: ir a mi Inicio») y la campana pasa a «Más».
  it("por debajo de sm «Inicio» se oculta (el logotipo lleva al mismo sitio) y la campana va dentro de «Más» por debajo de md", () => {
    render(barra(AGENTE));
    expect(clases(screen.getByTestId("barra-suite-inicio"))).toEqual(expect.arrayContaining(["hidden", "sm:inline-flex"]));
    expect(clases(screen.getByTestId("barra-suite-inicio"))).not.toContain("inline-flex");
    expect(screen.getByTestId("barra-suite-logo")).toHaveAttribute("aria-label", "Nadakki: ir a mi Inicio");
    expect(clases(screen.getByTestId("barra-notificaciones"))).toEqual(expect.arrayContaining(["hidden", "md:inline-flex"]));
    fireEvent.click(screen.getByRole("button", MAS));
    const enMas = within(screen.getByTestId("barra-mas-panel")).getByRole("link", { name: "Notificaciones" });
    expect(enMas).toHaveAttribute("href", "/notifications");
    expect(clases(enMas)).toContain("md:hidden");
  });

  it("«Inicio» es solo icono en móvil, con aria-label y el texto visible desde sm", () => {
    render(barra(AGENTE));
    const inicio = screen.getByTestId("barra-suite-inicio");
    expect(inicio).toHaveAttribute("aria-label", "Inicio");
    expect(inicio).toHaveTextContent("Inicio");
    expect(clases(within(inicio).getByText("Inicio"))).toEqual(expect.arrayContaining(["hidden", "sm:inline"]));
  });

  it("los controles de la barra no encogen (shrink-0); solo las migas ceden espacio (min-w-0 flex-1)", () => {
    render(barra(AGENTE));
    for (const id of ["barra-suite-logo", "barra-suite-inicio", "barra-suite-atras", "barra-suite-adelante", "barra-acciones", "barra-usuario"]) {
      expect({ id, c: clases(screen.getByTestId(id)).includes("shrink-0") }).toEqual({ id, c: true });
    }
    expect(clases(screen.getByTestId("barra-suite-migas"))).toEqual(expect.arrayContaining(["min-w-0", "flex-1"]));
  });

  it("separaciones compactas en móvil (gap-0.5) que vuelven a gap-1 desde sm, en la barra y en las acciones", () => {
    render(barra(AGENTE));
    for (const id of ["barra-suite", "barra-acciones"]) {
      expect(clases(screen.getByTestId(id))).toEqual(expect.arrayContaining(["gap-0.5", "sm:gap-1"]));
    }
  });

  it("el menú de usuario va en su hueco compacto (sin relleno lateral grande en móvil) y no se corta", () => {
    render(barra(AGENTE));
    const usuario = screen.getByTestId("barra-usuario");
    expect(within(usuario).getByTestId("user-menu")).toBeInTheDocument();
    expect(clases(usuario)).toEqual(expect.arrayContaining(["[&>div>button]:px-1", "md:[&>div>button]:px-3"]));
  });

  it("la tecla «Ctrl K» del buscador solo aparece desde lg (el botón es de icono por debajo)", () => {
    render(barra(AGENTE));
    const buscar = screen.getByTestId("barra-buscar");
    expect(clases(buscar.querySelector("kbd"))).toEqual(expect.arrayContaining(["hidden", "lg:inline"]));
    expect(clases(buscar)).toEqual(expect.arrayContaining(["lg:w-auto", "lg:px-2"]));
  });

  // Medido a 390 px con la regla global de 44 px por botón (app/globals.css): logotipo, Inicio, Atrás, Adelante y Módulos
  // (242 px) más buscar, notificaciones, «Más» y usuario (182 px) no caben. En móvil queda el gesto «atrás» del sistema.
  it("Atrás y Adelante solo se ven desde md (en móvil no caben con los objetivos táctiles de 44 px)", () => {
    render(barra(AGENTE));
    for (const id of ["barra-suite-atras", "barra-suite-adelante"]) {
      expect(clases(screen.getByTestId(id))).toEqual(expect.arrayContaining(["hidden", "md:inline-flex"]));
      expect(clases(screen.getByTestId(id))).not.toContain("inline-flex");
    }
  });
});

describe("migas: solo la última en móvil y centradas en la altura de la barra en todos los anchos", () => {
  it("con cuatro niveles, en móvil solo queda visible la última (las demás hidden md:flex) y su chevron se oculta", () => {
    render(<BarraSuite />);
    const items = within(screen.getByTestId("barra-suite-migas")).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    for (const li of items.slice(0, -1)) expect(clases(li)).toEqual(expect.arrayContaining(["hidden", "md:flex"]));
    const ultima = items[items.length - 1]!;
    expect(clases(ultima)).not.toContain("hidden");
    expect(clases(ultima.querySelector("svg"))).toEqual(expect.arrayContaining(["hidden", "md:block"]));
  });

  it("una sola miga (la portada) sigue visible en móvil", () => {
    pathname = "/";
    render(<BarraSuite />);
    const items = within(screen.getByTestId("barra-suite-migas")).getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(clases(items[0]!)).not.toContain("hidden");
  });

  it("alineación: la lista ocupa todo el alto y centra; cada miga centra; el enlace es un bloque de línea fija", () => {
    render(<BarraSuite />);
    const ol = screen.getByTestId("barra-suite-migas");
    expect(clases(ol)).toEqual(expect.arrayContaining(["flex", "self-stretch", "items-center"]));
    for (const li of within(ol).getAllByRole("listitem")) expect(clases(li)).toEqual(expect.arrayContaining(["h-full", "items-center"]));
    for (const a of within(ol).getAllByRole("link")) {
      expect(clases(a)).toEqual(expect.arrayContaining(["block", "truncate", "leading-5", "focus-visible:outline"]));
    }
  });
});

describe("Atrás/Adelante: borde ≥3:1 contra la barra y deshabilitado distinguible; foco visible", () => {
  // Paleta de Tailwind 3 (zinc): la barra es bg-zinc-950.
  const ZINC: Record<string, string> = { "500": "#71717a", "600": "#52525b", "700": "#3f3f46", "800": "#27272a", "950": "#09090b" };
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const contraste = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };

  it.each(["barra-suite-atras", "barra-suite-adelante"])("%s", (id) => {
    render(<BarraSuite />);
    const b = screen.getByTestId(id);
    const c = clases(b);
    expect(c).toContain("border");
    const tono = c.find((x) => /^border-zinc-\d+$/.test(x))?.replace("border-zinc-", "");
    expect(tono).toBeDefined();
    expect(contraste(ZINC[tono!]!, ZINC["950"]!)).toBeGreaterThanOrEqual(3);
    // deshabilitado (sin Navigation API arrancan así): distinto del activo y sin el borde de control activo
    expect(b).toBeDisabled();
    expect(c).toEqual(expect.arrayContaining(["disabled:opacity-40", "disabled:border-dashed"]));
    expect(b).toHaveAttribute("aria-label");
    expect(c).toEqual(expect.arrayContaining(["focus-visible:outline", "focus-visible:outline-2", "focus-visible:outline-amber-400"]));
  });
});

describe("botones de icono: aria-label y foco visible", () => {
  it.each(["barra-suite-logo", "barra-suite-inicio", "barra-suite-atras", "barra-suite-adelante", "barra-buscar", "barra-notificaciones"])("%s", (id) => {
    render(barra(AGENTE));
    const el = screen.getByTestId(id);
    expect(el.getAttribute("aria-label")?.trim()).toBeTruthy();
    expect(clases(el)).toContain("focus-visible:outline");
  });
});

describe("la medida en navegador existe (e2e/visual/barra-movil.spec.ts)", () => {
  const spec = fs.readFileSync(path.join(process.cwd(), "e2e/visual/barra-movil.spec.ts"), "utf8");
  it("mide a 390, 768 y 1280 px con boundingBox y comprueba que no hay scroll horizontal", () => {
    for (const w of ["390", "768", "1280"]) expect(spec).toContain(w);
    expect(spec).toContain("boundingBox");
    expect(spec).toMatch(/scrollWidth/);
    expect(spec).toContain("Más opciones de la barra");
  });
});

describe("la misma barra en módulos de ModuleShell (Legal, Marketing y Proyectos), no solo en Realtor", () => {
  const ADMIN_TENANT = {
    user: { id: "u2", email: "cesar.soriano@sorianorealty.com" },
    tenant: { id: "t1", display_name: "Soriano Realty", subscribed_cores: ["legal", "marketing", "projects", "real_estate"] },
    allRoles: [{ core_name: "platform", role_key: "tenant_admin", display_name: "Administrador" }],
    fijarContexto: jest.fn(),
  } as unknown as AuthContextValue;
  const CASOS = [
    { id: "legal", ruta: "/legal/cases/new", migas: 3 },
    { id: "marketing", ruta: "/marketing/campaigns", migas: 3 },
    { id: "proyectos", ruta: "/proyectos", migas: 2 },
  ];

  it.each(CASOS)("$id ($ruta): «Más» con el tenant, migas reducidas, Inicio de icono con aria-label, sin selector de contexto", ({ id, ruta, migas }) => {
    pathname = ruta;
    const modulo = MODULOS.find((m) => m.id === id)!;
    render(con(ADMIN_TENANT, <ModuleShell modulo={modulo}><p>contenido</p></ModuleShell>));
    const b = screen.getByTestId("barra-suite");
    expect(within(b).getByTestId("barra-suite-inicio")).toHaveAttribute("aria-label", "Inicio");
    expect(within(b).getByRole("button", { name: "Abrir el menú del módulo" })).toHaveAttribute("aria-label");
    const items = within(screen.getByTestId("barra-suite-migas")).getAllByRole("listitem");
    expect(items.length).toBe(migas);
    for (const li of items.slice(0, -1)) expect(clases(li)).toEqual(expect.arrayContaining(["hidden", "md:flex"]));
    expect(clases(items[items.length - 1]!)).not.toContain("hidden");
    fireEvent.click(within(b).getByRole("button", MAS));
    expect(within(screen.getByTestId("barra-mas-panel")).getByTestId("tenant-switcher")).toHaveTextContent("Soriano Realty");
    expect(screen.queryByTestId("selector-contexto")).toBeNull();
    expect(screen.queryByTestId("hueco-contexto")).toBeNull();
  });

  it.each(CASOS)("$id sin sesión: solo la base, sin «Más»", ({ id, ruta }) => {
    pathname = ruta;
    render(<ModuleShell modulo={MODULOS.find((m) => m.id === id)!}>x</ModuleShell>);
    expect(screen.getByTestId("barra-suite")).toBeInTheDocument();
    expect(screen.queryByRole("button", MAS)).toBeNull();
  });
});

describe("el spec e2e cubre los dos módulos de ModuleShell a 390 px", () => {
  const spec = fs.readFileSync(path.join(process.cwd(), "e2e/visual/barra-movil.spec.ts"), "utf8");
  it("rutas de Marketing y Proyectos además de /realtor", () => {
    for (const r of ['"/realtor"', '"/marketing/campaigns"', '"/proyectos"']) expect(spec).toContain(r);
  });
});
