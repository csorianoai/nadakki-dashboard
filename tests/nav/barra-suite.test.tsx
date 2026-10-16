/**
 * Volver a la Suite desde cualquier core (César, 2026-10-13: al entrar en Credit Hub o Dealer OS no había
 * forma de volver al menú principal con un clic). Cada bloque intenta romper un criterio:
 *   (1) en todas las carcasas, el logotipo de arriba a la izquierda y el botón «Inicio» llevan a "/";
 *   (2) migas Inicio › Módulo › Sección › Pantalla, cada nivel con enlace, sacadas de los menús existentes;
 *   (3) Atrás y Adelante usan el historial del navegador; el guard de sesión no deja una entrada que redirige;
 *   (4) los cores con menú propio quedan bajo la barra (MarcoSuite), sin que su menú quede cortado.
 * La prueba en navegador (un clic al Inicio y Atrás vuelve) está en e2e/visual/volver-al-inicio.spec.ts.
 */
import fs from "fs";
import path from "path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import AppGate from "@/components/auth/AppGate";
import { BarraSuite } from "@/components/nav/BarraSuite";
import { migasDe } from "@/lib/migas";
import { NAV_SECTIONS, filterSectionsForUser, userCanAccessAdminNav } from "@/components/forge/layout/forge-global-sidebar-nav";
import { NAVEGACION, PESTANAS_MARKETING } from "@/lib/navigation";
import { DEALER_NAV_GROUPS } from "@/components/dealer-management/shell/dealer-nav";

let pathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
// La barra lee el rol de la sesión (Inicio por rol); aquí, superadmin: su aterrizaje es "/" (ver retorno-inicio-por-rol.test.tsx).
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isLoading: false, isAuthenticated: true, allRoles: [{ role_key: "platform_superadmin", core_name: "platform", display_name: "Administrador" }] }),
}));
beforeEach(() => Object.defineProperty(globalThis, "navigation", { configurable: true, value: undefined }));
jest.mock("@/components/forge/auth/ProtectedRoute", () => ({
  __esModule: true,
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));
jest.mock("@/components/forge/layout/GlobalForgeAppShell", () => ({
  __esModule: true,
  GlobalForgeAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="forge-shell">{children}</div>,
}));
jest.mock("@/components/dealer/ContableChrome", () => ({
  __esModule: true,
  ContableChrome: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/ai/OnboardingAgent", () => ({ __esModule: true, default: () => null }));

const ROOT = process.cwd();
const RUTAS_CORE = [
  "/", "/sic", "/credit-hub", "/credit-hub/bank", "/credit-hub/bank-v2", "/credit-hub/bank-v2/solicitudes",
  "/credit-hub/dealer/applications", "/autos/dealer", "/autos/dealer/inventario", "/centro-operativo",
  "/realtor", "/realtor/clientes", "/cockpit", "/contable", "/credit/dashboard", "/marketing/campaigns",
];
const etiquetas = (r: string) => migasDe(r).map((m) => m.label);

describe("(1) logotipo e Inicio llevan a la Suite en todas las carcasas", () => {
  test.each(RUTAS_CORE)("%s", (r) => {
    pathname = r;
    render(<AppGate>contenido</AppGate>);
    const barra = screen.getByTestId("barra-suite");
    expect(within(barra).getByTestId("barra-suite-logo")).toHaveAttribute("href", "/");
    const inicio = within(barra).getByTestId("barra-suite-inicio");
    expect(inicio).toHaveAttribute("href", "/");
    expect(inicio).toHaveTextContent("Inicio");
    expect(inicio.querySelector("svg")).not.toBeNull();                 // icono de casa
    // la barra va antes que la carcasa: es lo de arriba a la izquierda
    expect(barra.compareDocumentPosition(screen.getByText("contenido")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("las pantallas sin sesión (login, consentimiento, portal público) no llevan la barra", () => {
    for (const r of ["/login", "/logout", "/consent/x", "/autos"]) {
      pathname = r;
      const { unmount } = render(<AppGate>x</AppGate>);
      expect(screen.queryByTestId("barra-suite")).toBeNull();
      unmount();
    }
  });
});

describe("(2) migas Inicio › Módulo › Sección › Pantalla", () => {
  test("cores con menú propio: del menú del core", () => {
    expect(etiquetas("/credit-hub/bank-v2/solicitudes")).toEqual(["Inicio", "Banco", "Operación", "Bandeja"]);
    expect(etiquetas("/credit-hub/bank-v2/kpis")).toEqual(["Inicio", "Banco", "Inteligencia", "KPIs de banco"]);
    expect(etiquetas("/credit-hub/bank-v2")).toEqual(["Inicio", "Banco"]);
    expect(etiquetas("/autos/dealer/finanzas")).toEqual(["Inicio", "Dealer OS", "Finanzas", "Finanzas por vehículo"]);
    expect(etiquetas("/autos/dealer")).toEqual(["Inicio", "Dealer OS"]);
    expect(etiquetas("/realtor/clientes")).toEqual(["Inicio", "Realtor OS", "Clientes", "Contactos"]);
  });

  test("Realtor OS: bloque fijo y centros de la barra (Propietarios, Alta y Agente web, decisión de César 2026-10-16) bajo su grupo", () => {
    const rt = { label: "Realtor OS", href: "/realtor" };
    const esperado: Record<string, { label: string; href: string }[]> = {
      "/realtor/smart-calendar": [rt, { label: "Smart Calendar", href: "/realtor/smart-calendar" }],
      "/realtor/propietarios": [rt, { label: "Clientes", href: "/realtor/clientes" }, { label: "Propietarios", href: "/realtor/propietarios" }],
      "/realtor/alta": [rt, { label: "Crecer", href: "/realtor/marketing-ai" }, { label: "Alta", href: "/realtor/alta" }],
      "/realtor/agente-web": [rt, { label: "Crecer", href: "/realtor/marketing-ai" }, { label: "Agente web", href: "/realtor/agente-web" }],
    };
    for (const [ruta, resto] of Object.entries(esperado)) {
      const m = migasDe(ruta);
      expect(m).toEqual([{ label: "Inicio", href: "/" }, ...resto]);
      expect(m.map((x) => x.label)).not.toContain("Herramientas");
    }
  });

  test("detalle: la pantalla final es la propia ruta", () => {
    const m = migasDe("/credit-hub/bank-v2/solicitudes/0b1c2d3e-aaaa-bbbb-cccc-000000000001");
    expect(m.map((x) => x.label)).toEqual(["Inicio", "Banco", "Operación", "Bandeja", "Detalle"]);
    expect(m[m.length - 1].href).toBe("/credit-hub/bank-v2/solicitudes/0b1c2d3e-aaaa-bbbb-cccc-000000000001");
  });

  test("Suite: de lib/navigation.ts; Marketing por pestañas", () => {
    expect(etiquetas("/")).toEqual(["Inicio"]);
    expect(etiquetas("/marketing/campaigns")).toEqual(["Inicio", "Marketing", "Campañas"]);
    expect(etiquetas("/sic/bandeja")[0]).toBe("Inicio");
    expect(etiquetas("/sic/bandeja")).toContain("SIC: bandeja");
  });

  test("toda miga tiene enlace interno y empieza en Inicio", () => {
    for (const r of [...RUTAS_CORE, "/ruta/que/nadie/conoce"]) {
      const m = migasDe(r);
      expect(m[0]).toEqual({ label: "Inicio", href: "/" });
      expect(m.length).toBeLessThanOrEqual(5);
      for (const x of m) expect(x.href.startsWith("/")).toBe(true);
    }
  });

  test("la barra pinta cada miga como enlace", () => {
    pathname = "/credit-hub/bank-v2/solicitudes";
    render(<BarraSuite />);
    const migas = within(screen.getByTestId("barra-suite-migas")).getAllByRole("link");
    expect(migas.map((a) => a.getAttribute("href"))).toEqual(["/", "/credit-hub/bank-v2", "/credit-hub/bank-v2", "/credit-hub/bank-v2/solicitudes"]);
    expect(migas[migas.length - 1]).toHaveAttribute("aria-current", "page");
  });
});

describe("(3) Atrás y Adelante usan el historial del navegador", () => {
  test("cada botón llama a history.back / history.forward (con historial propio medido por la Navigation API)", () => {
    // Sin Navigation API los botones arrancan desactivados (retorno-inicio-por-rol.test.tsx); aquí hay historial.
    Object.defineProperty(globalThis, "navigation", { configurable: true, value: { canGoBack: true, canGoForward: true } });
    const back = jest.spyOn(window.history, "back").mockImplementation(() => undefined);
    const forward = jest.spyOn(window.history, "forward").mockImplementation(() => undefined);
    pathname = "/autos/dealer";
    render(<BarraSuite />);
    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    fireEvent.click(screen.getByRole("button", { name: "Adelante" }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(forward).toHaveBeenCalledTimes(1);
  });

  test("el guard de sesión redirige con replace: Atrás no vuelve a una pantalla que redirige otra vez", () => {
    const src = fs.readFileSync(path.join(ROOT, "components/forge/auth/ProtectedRoute.tsx"), "utf8");
    expect(src).toContain("router.replace(fallbackPath)");
    expect(src).not.toMatch(/useEffect[\s\S]{0,400}router\.push\(fallbackPath\)/);
  });
});

describe("(4) los cores con menú propio quedan bajo la barra sin cortarse", () => {
  test("las carcasas medidas con 100vh usan el alto que deja la barra", () => {
    for (const f of ["components/realtor/shell/RealtorShell.tsx", "components/realtor/shell/ShellSidebar.tsx", "components/credit-hub/shell/ChAppShell.tsx"]) {
      expect(fs.readFileSync(path.join(ROOT, f), "utf8")).not.toMatch(/"100vh"/);
    }
    const css = fs.readFileSync(path.join(ROOT, "app/globals.css"), "utf8");
    for (const sel of ["[data-marco-suite] .h-screen", "[data-marco-suite] .min-h-screen", "[data-marco-suite] .lg\\:h-screen"]) {
      expect(css).toContain(sel);
    }
  });
});


describe("(5) los cajones laterales en móvil empiezan bajo la barra de 40 px", () => {
  const CAJONES = [
    "components/forge/layout/ForgeGlobalCoresSidebar.tsx",
    "components/dealer-management/shell/DealerSidebar.tsx",
    "components/dcc/shell/DccShellSidebar.tsx",
    "components/shell/clases.ts",                  // cajón de ModuleShell (portada y módulos migrados)
    "components/cockpit/CockpitSidebar.tsx",
  ];
  test.each(CAJONES)("%s no es fixed inset-y-0", (f) => {
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    expect(src).not.toMatch(/fixed[^"`]*inset-y-0/);
    expect(src).toMatch(/fixed[^"`]*top-1[02]|top-10[^"`]*fixed/);          // 40 px (top-10) o el botón del Cockpit (top-12)
  });
});

describe("(6) las migas no enseñan a nadie un enlace que su menú le oculta (auditor de #825, criterio 3)", () => {
  const rol = (role_key: string, core_name = "core") => [{ role_key, core_name }] as never;
  const TODOS_LOS_MODULOS = Array.from(new Set(NAVEGACION.flatMap((s) => [...s.coreMatchers, ...s.children.flatMap((c) => c.coreMatchers ?? [])])));
  const USUARIOS: [string, never, string[] | undefined][] = [
    ["tenant_admin", rol("tenant_admin"), TODOS_LOS_MODULOS],
    ["tenant_admin sin módulos", rol("tenant_admin"), []],
    ["platform_superadmin", rol("platform_superadmin"), TODOS_LOS_MODULOS],
    ["banker", rol("banker", "credit"), TODOS_LOS_MODULOS],
    ["dealer_user", rol("dealer_user", "credit"), TODOS_LOS_MODULOS],
    ["sin rol", [] as never, []],
  ];

  test("tenant_admin en /settings, /settings/integrations, /billing y /audit: ninguna miga apunta a /admin", () => {
    for (const r of ["/settings", "/settings/integrations", "/billing", "/audit"]) {
      const hrefs = migasDe(r).map((m) => m.href);
      expect(hrefs).not.toContain("/admin");
      expect(hrefs).not.toContain("/admin/gates");
    }
    pathname = "/settings";
    render(<BarraSuite />);
    const enlaces = within(screen.getByTestId("barra-suite-migas")).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(enlaces.some((h) => h?.startsWith("/admin"))).toBe(false);
    expect(etiquetas("/settings")).toEqual(["Inicio", "Administración", "Ajustes"]);
  });

  test("un superadmin en /admin sigue viendo Administración apuntando a la ruta abierta", () => {
    expect(migasDe("/admin")).toEqual([{ label: "Inicio", href: "/" }, { label: "Administración", href: "/admin" }]);
  });

  test.each(USUARIOS)("%s: todo enlace de las migas de una pantalla que su menú le muestra, también está en su menú", (_n, roles, subs) => {
    const visibles = filterSectionsForUser(NAV_SECTIONS, roles, subs, userCanAccessAdminNav(roles));
    const hrefsVisibles = new Set(visibles.flatMap((s) => [s.href, ...s.children.flatMap((c) => [c.href, ...(c.children ?? []).map((h) => h.href)])]).filter(Boolean).map((h) => (h as string).split(/[?#]/)[0]));
    const MARKETING = new Set(["/marketing-hub", ...PESTANAS_MARKETING.flatMap((p) => [p.href, ...p.paginas.map((g) => g.href)]).map((h) => h.split(/[?#]/)[0])]);
    let revisadas = 0;
    for (const s of visibles) {
      for (const c of [...s.children, ...s.children.flatMap((x) => x.children ?? [])]) {
        if (!c.href) continue;
        const ruta = c.href.split(/[?#]/)[0];
        if (MARKETING.has(ruta)) continue;
        revisadas++;
        for (const m of migasDe(ruta)) {
          const h = m.href.split(/[?#]/)[0];
          expect({ ruta, miga: m.label, h, visible: h === "/" || h === ruta || hrefsVisibles.has(h) }).toEqual({ ruta, miga: m.label, h, visible: true });
        }
      }
    }
    expect(revisadas).toBeGreaterThan(0);
  });

  test("Dealer OS y banco v2: el enlace de la sección no es una entrada con rol, plan o capacidad", () => {
    // Dealer OS: «Conexiones» exige la capacidad autos.api.access; el grupo no puede enlazar a ella si hay otra libre.
    const dealer = migasDe("/autos/dealer/conexiones");
    expect(dealer.map((m) => m.href)).toEqual(["/", "/autos/dealer", "/autos/dealer/estado", "/autos/dealer/conexiones"]);
    // Una entrada restringida primera en el grupo: la sección cae a la pantalla abierta, nunca a la restringida.
    for (const g of DEALER_NAV_GROUPS) {
      const libre = g.items.find((i) => i.capability === null);
      for (const it of g.items) {
        const href = migasDe(it.href).find((m) => m.label === g.label)?.href;
        if (href === undefined) continue;
        expect(href === it.href || href === libre?.href || g.items.find((i) => i.href === href)?.capability === null).toBe(true);
      }
    }
  });
});
