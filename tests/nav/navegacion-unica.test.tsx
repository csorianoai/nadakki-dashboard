/**
 * Rediseño de la navegación (César, 2026-10-13; entra el personal).
 * Cada bloque intenta romper una de las cinco promesas:
 *   (1) una sola fuente, 8 secciones de trabajo + Administración, como mucho 2 niveles;
 *   (2) cada usuario ve solo lo suyo (módulos del tenant y rol);
 *   (3) las pantallas de desarrollo y duplicadas fuera del menú y del buscador, sin borrarlas;
 *   (4) un solo desplegable abierto, Ctrl+K sobre la misma fuente, «no encontrado» con salida;
 *   (5) todo en español.
 */
import fs from "fs";
import path from "path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { RoleInfo } from "@/lib/api/auth-v2";
import {
  NAVEGACION,
  PESTANAS_MARKETING,
  RUTAS_OCULTAS,
  entradasBuscador,
  esRutaOculta,
  pestanaMarketingActiva,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";
import { NAV_SECTIONS, filterSectionsForUser, userCanAccessAdminNav } from "@/components/forge/layout/forge-global-sidebar-nav";

const ROOT = process.cwd();
const rol = (role_key: string, core_name = "credit"): RoleInfo => ({ core_name, role_key, display_name: role_key });
const ver = (roles: RoleInfo[], cores: string[]) =>
  filterSectionsForUser(NAV_SECTIONS, roles, cores, userCanAccessAdminNav(roles));
const ids = (secs: NavSection[]) => secs.map((s) => s.id);
const hrefs = (items: NavItem[]): string[] => items.flatMap((i) => [...(i.href ? [i.href] : []), ...hrefs(i.children ?? [])]);

describe("(1) una sola fuente, 8 secciones + Administración, 2 niveles", () => {
  it("el menú lateral usa lib/navigation.ts tal cual", () => {
    expect(NAV_SECTIONS).toBe(NAVEGACION);
  });

  it("las secciones son exactamente las nueve, en este orden", () => {
    expect(NAVEGACION.map((s) => s.label)).toEqual([
      "Inicio", "Concesionarios", "Crédito", "Marketing", "Contabilidad", "Legal", "Proyectos", "Real Estate",
      "Administración",
    ]);
  });

  it("ninguna página tiene hijos: sección → página y nada más", () => {
    for (const s of NAVEGACION) for (const it of s.children) expect(it.children ?? []).toEqual([]);
    for (const p of PESTANAS_MARKETING) expect(p.paginas.length).toBeGreaterThan(0);
  });

  it("Marketing es una sola entrada y sus pantallas van en seis pestañas", () => {
    const mkt = NAVEGACION.find((s) => s.id === "marketing-hub")!;
    expect(mkt.href).toBe("/marketing-hub");
    expect(mkt.children).toHaveLength(1);
    expect(PESTANAS_MARKETING.map((p) => p.label)).toEqual(["Campañas", "Anuncios", "Redes", "Contenido", "Leads", "Resultados"]);
  });

  it.each([
    ["/workflows/email-automation-master", "campanas"],
    ["/advertising/google-ads", "anuncios"],
    ["/social/inbox", "redes"],
    ["/ai-studio/agents", "contenido"],
    ["/library/assets", "contenido"],
    ["/segments/builder", "leads"],
    ["/audiences", "leads"],
    ["/intelligence/brand", "resultados"],
    ["/analytics/roi", "resultados"],
    ["/autopilot", "campanas"],
    ["/ame", "campanas"],
    ["/marketing-hub", "campanas"],
    ["/marketing", "campanas"],
  ])("%s abre la pestaña %s", (ruta, pestana) => {
    expect(pestanaMarketingActiva(ruta)?.id).toBe(pestana);
  });

  it("fuera de marketing no hay pestañas", () => {
    expect(pestanaMarketingActiva("/legal")).toBeNull();
    expect(pestanaMarketingActiva("/marketingx")).toBeNull();
  });

  it("toda página del menú y de las pestañas existe en app/", () => {
    const paginas = new Set<string>();
    const walk = (dir: string, ruta: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
          const seg = /^\(.*\)$/.test(e.name) ? "" : `/${e.name}`;
          walk(path.join(dir, e.name), ruta + seg);
        } else if (e.name === "page.tsx") paginas.add(ruta || "/");
      }
    };
    walk(path.join(ROOT, "app"), "");
    const todas = [...NAVEGACION.flatMap((s) => hrefs(s.children)), ...PESTANAS_MARKETING.flatMap((p) => p.paginas.map((x) => x.href))];
    for (const h of todas) expect([h, paginas.has(h.split("?")[0]!)]).toEqual([h, true]);
  });
});

describe("(2) cada usuario ve solo lo suyo", () => {
  it("sin módulos: solo Inicio (y Real Estate, que decide /acceso en el componente)", () => {
    expect(ids(ver([rol("caja", "autos")], []))).toEqual(["inicio", "real-estate"]);
    expect(hrefs(ver([rol("caja", "autos")], [])[0]!.children)).toEqual(["/", "/notifications"]);
  });

  it("con legal y credit solo aparecen esas dos secciones de trabajo", () => {
    expect(ids(ver([rol("banker")], ["legal", "credit"]))).toEqual(["inicio", "credit-hub", "legal-hub", "real-estate"]);
  });

  it("en Crédito, el banco ve lo del banco y el concesionario lo suyo", () => {
    const banco = hrefs(ver([rol("bank_analyst")], ["credit"]).find((s) => s.id === "credit-hub")!.children);
    const dealer = hrefs(ver([rol("dealer")], ["credit"]).find((s) => s.id === "credit-hub")!.children);
    expect(banco).toContain("/credit-hub/bank-v2/solicitudes");
    expect(banco.some((h) => h.startsWith("/credit-hub/dealer") || h.startsWith("/autos/dealer/credito"))).toBe(false);
    // El crédito del concesionario vive en Dealer OS (PR 2 "una sola interfaz").
    expect(dealer).toContain("/autos/dealer/credito/solicitudes");
    expect(dealer.some((h) => h.startsWith("/credit-hub/bank"))).toBe(false);
  });

  it("SIC va con su propio módulo dentro de Crédito", () => {
    const sinSic = hrefs(ver([rol("banker")], ["credit"]).find((s) => s.id === "credit-hub")!.children);
    const conSic = hrefs(ver([rol("banker")], ["credit", "sic"]).find((s) => s.id === "credit-hub")!.children);
    expect(sinSic.some((h) => h.startsWith("/sic"))).toBe(false);
    expect(conSic).toContain("/sic/expedientes");
  });

  it("Administración: solo platform_superadmin y tenant_admin", () => {
    expect(ids(ver([rol("platform_superadmin", "platform")], []))).toContain("admin");
    expect(ids(ver([rol("tenant_admin", "platform")], []))).toContain("admin");
    for (const r of [rol("support_agent", "platform"), rol("banker"), rol("dealer"), rol("credit_admin")]) {
      expect(ids(ver([r], ["credit", "marketing"]))).not.toContain("admin");
    }
  });

  it("el módulo solo lo salta platform_superadmin; tenant_admin ve los de su tenant", () => {
    const ta = [rol("tenant_admin", "platform")];
    expect(ids(ver(ta, ["legal"]))).toEqual(["inicio", "legal-hub", "real-estate", "admin"]);
    expect(ids(ver([rol("platform_superadmin", "platform")], []))).toEqual(expect.arrayContaining(["credit-hub", "marketing-hub", "legal-hub"]));
    // dentro de un módulo suyo, tenant_admin ve banco y concesionario (bypass de rol, no de módulo)
    const credito = hrefs(ver(ta, ["credit"]).find((s) => s.id === "credit-hub")!.children);
    expect(credito).toEqual(expect.arrayContaining(["/credit-hub/bank-v2", "/autos/dealer/credito"]));
    expect(credito.some((h) => h.startsWith("/sic"))).toBe(false);
  });

  it("tenant_admin no ve las pantallas de plataforma (las abre solo el superadmin)", () => {
    const ta = hrefs(ver([rol("tenant_admin", "platform")], []).find((s) => s.id === "admin")!.children);
    const sa = hrefs(ver([rol("platform_superadmin", "platform")], []).find((s) => s.id === "admin")!.children);
    for (const h of ["/admin", "/admin/gates", "/feature-flags"]) {
      expect(ta).not.toContain(h);
      expect(sa).toContain(h);
    }
    expect(ta).toEqual(expect.arrayContaining(["/settings", "/billing", "/audit"]));
  });

  it("el buscador enseña lo mismo que el menú, ni una pantalla más", () => {
    const secs = ver([rol("banker")], ["credit"]);
    const delMenu = new Set(secs.flatMap((s) => hrefs(s.children)));
    for (const e of entradasBuscador(secs)) expect(delMenu.has(e.href)).toBe(true);
    const conMkt = ver([rol("marketer", "marketing")], ["marketing"]);
    expect(entradasBuscador(conMkt).map((e) => e.href)).toContain("/advertising/google-ads");
    expect(entradasBuscador(secs).map((e) => e.href)).not.toContain("/advertising/google-ads");
  });
});

describe("(3) desarrollo y duplicadas: fuera del menú y del buscador, sin borrar", () => {
  const OCULTAS = [
    "/credit-hub/_design/shell-preview", "/credit-hub/components", "/credit-hub/preview", "/testing", "/testing/lab",
    "/sic/demo", "/workflow-real", "/execute", "/agents/execute", "/bank/applications",
    "/proyectos/123/masterplan", "/autos/dealer/inicio-v2", "/autos/dealer/reportes-v2",
  ];

  it.each(OCULTAS)("%s está oculta", (ruta) => expect(esRutaOculta(ruta)).toBe(true));

  it.each(["/credit-hub/bank-v2", "/credit-hub/bank-v2/solicitudes", "/proyectos/123/master-plan", "/autos/dealer", "/sic", "/bankers", "/testingx"])(
    "%s NO está oculta",
    (ruta) => expect(esRutaOculta(ruta)).toBe(false),
  );

  it("ninguna página del menú ni de las pestañas es una oculta", () => {
    const todas = [...NAVEGACION.flatMap((s) => hrefs(s.children)), ...PESTANAS_MARKETING.flatMap((p) => p.paginas.map((x) => x.href))];
    for (const h of todas) expect([h, esRutaOculta(h)]).toEqual([h, false]);
  });

  it("las ocultas siguen existiendo en app/ (no se borra nada)", () => {
    for (const f of [
      "app/(forge)/credit-hub/_design/shell-preview/page.tsx", "app/(forge)/credit-hub/components/page.tsx",
      "app/(forge)/credit-hub/preview/page.tsx", "app/testing/page.tsx", "app/sic/demo/page.tsx",
      "app/(bank)/workflow-real/page.tsx", "app/execute/page.tsx", "app/(bank)/bank/applications",
      "app/proyectos/[id]/masterplan/page.tsx",
      "app/autos/dealer/inicio-v2/page.tsx", "app/autos/dealer/reportes-v2/page.tsx",
    ]) expect([f, fs.existsSync(path.join(ROOT, f))]).toEqual([f, true]);
  });

  it("cada duplicada dice cuál es la vigente", () => {
    for (const o of RUTAS_OCULTAS.filter((x) => /duplicad|versión|copia/.test(x.motivo))) expect(o.vigente).toBeTruthy();
  });
});

describe("(5) todo en español", () => {
  const INGLES = /\b(Hub|Overview|Dashboard|Settings|Builder|Legacy|root|Command|Inbox|Library|Workflows?|Network|Feature|Audit|Billing|Agents?)\b/;
  it("ninguna etiqueta del menú, de las pestañas ni de sus pantallas está en inglés", () => {
    const etiquetas = [
      ...NAVEGACION.flatMap((s) => [s.label, ...s.children.map((c) => c.label)]),
      ...PESTANAS_MARKETING.flatMap((p) => [p.label, ...p.paginas.map((x) => x.label)]),
    ];
    for (const e of etiquetas) expect([e, INGLES.test(e)]).toEqual([e, false]);
  });
});

// ── (4) comportamiento: menú, buscador y «no encontrado» ─────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockPath = "/legal/cases";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPath,
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
}));
const mockAuth = {
  tenant: { id: "t1", slug: "ops", display_name: "Ops", subscribed_cores: ["legal", "credit", "projects"] },
  allRoles: [{ core_name: "credit", role_key: "banker" }],
  allTenants: [],
  user: { email: "a@b.c", name: "A" },
  activeRole: null,
  isAuthenticated: true,
};
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/lib/hooks/useTenantBranding", () => ({ useTenantBranding: () => ({ data: null, isPending: false }) }));
const mockBatch = { isError: false, error: null, isPending: false, isLoading: false, data: { results: {} } };
jest.mock("@/lib/access/hooks", () => ({ useAccessEntitlementsBatch: () => mockBatch }));
jest.mock("@/components/realtor/useRealtorAccess", () => ({ useRealtorAccess: () => "no" }));

// eslint-disable-next-line import/first
import { ForgeGlobalCoresSidebar } from "@/components/forge/layout/ForgeGlobalCoresSidebar";
// eslint-disable-next-line import/first
import { BuscadorNavegacion } from "@/components/nav/BuscadorNavegacion";
// eslint-disable-next-line import/first
import { PaginaNoEncontrada } from "@/components/nav/PaginaNoEncontrada";

describe("(4) un solo desplegable abierto a la vez", () => {
  beforeEach(() => {
    mockPath = "/legal/cases";
    window.localStorage.clear();
  });

  it("al entrar, abierta solo la sección de la página actual; abrir otra cierra la anterior", () => {
    render(<ForgeGlobalCoresSidebar mobileOpen={false} />);
    const legal = screen.getByTestId("nav-seccion-legal-hub");
    const credito = screen.getByTestId("nav-seccion-credit-hub");
    const proyectos = screen.getByTestId("nav-seccion-projects-hub");
    expect(legal).toHaveAttribute("aria-expanded", "true");
    expect(credito).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(credito);
    expect(credito).toHaveAttribute("aria-expanded", "true");
    expect(legal).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(proyectos);
    expect(proyectos).toHaveAttribute("aria-expanded", "true");
    expect(credito).toHaveAttribute("aria-expanded", "false");
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(1);
  });

  it("no pinta secciones de módulos que el tenant no tiene", () => {
    render(<ForgeGlobalCoresSidebar mobileOpen={false} />);
    expect(screen.queryByTestId("nav-seccion-marketing-hub")).toBeNull();
    expect(screen.queryByTestId("nav-seccion-concesionarios")).toBeNull();
    expect(screen.queryByTestId("nav-seccion-admin")).toBeNull();
  });
});

describe("(4) buscador Ctrl+K sobre la misma fuente", () => {
  beforeAll(() => {
    // cmdk mide la lista; jsdom no trae ResizeObserver ni scrollIntoView.
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    Element.prototype.scrollIntoView = () => {};
  });

  it("Ctrl+K abre el buscador con las pantallas del usuario y lleva a la elegida", () => {
    mockPath = "/legal";
    render(<BuscadorNavegacion />);
    act(() => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
    expect(screen.getByPlaceholderText("Buscar una pantalla…")).toBeInTheDocument();
    expect(screen.getByText("Expedientes")).toBeInTheDocument();
    expect(screen.queryByText("Google Ads")).toBeNull(); // marketing no está contratado
    fireEvent.click(screen.getByText("Contratos"));
    expect(mockPush).toHaveBeenCalledWith("/legal/contracts");
  });

  it("en Credit Hub no registra el atajo (manda el buscador propio de Credit Hub)", () => {
    mockPath = "/credit-hub/bank";
    render(<BuscadorNavegacion />);
    act(() => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
    expect(screen.queryByPlaceholderText("Buscar una pantalla…")).toBeNull();
  });
});

describe("(4) «no encontrado» con salida", () => {
  it("dice qué pasó y ofrece Volver e Ir al inicio", () => {
    render(<PaginaNoEncontrada />);
    expect(screen.getByText("No encontramos esta página")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Volver/ }));
    expect(mockBack.mock.calls.length + mockPush.mock.calls.length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Ir al inicio/ })).toHaveAttribute("href", "/");
  });

  it("la ruta de un core inexistente ya no pinta la pantalla vacía «Core no encontrado»", () => {
    for (const f of ["app/[core]/page.tsx", "app/[core]/[agentId]/page.tsx"]) {
      const src = fs.readFileSync(path.join(ROOT, f), "utf8");
      expect(src).not.toContain("Core no encontrado");
      expect(src).toContain("<PaginaNoEncontrada");
    }
    expect(fs.readFileSync(path.join(ROOT, "app/not-found.tsx"), "utf8")).toContain("<PaginaNoEncontrada");
  });
});

describe("Administración › Real Estate: enlaza a /admin/real-estate (PS-4-ADMIN-REAL-ESTATE)", () => {
  const fila = (secs: NavSection[]) => secs.find((s) => s.id === "admin")?.children.find((i) => i.id === "adm-real-estate");

  it("la ven platform_superadmin y tenant_admin con href y sin pronto", () => {
    for (const r of ["platform_superadmin", "tenant_admin"]) {
      const it = fila(ver([rol(r, "platform")], []));
      expect(it).toMatchObject({ label: "Real Estate", href: "/admin/real-estate" });
      expect(it?.pronto).toBeUndefined();
    }
  });

  it("no amplía permisos: nadie más ve Administración ni la fila", () => {
    for (const r of [rol("support_agent", "platform"), rol("banker"), rol("dealer"), rol("credit_admin")]) {
      expect(fila(ver([r], ["credit", "marketing", "legal"]))).toBeUndefined();
    }
  });

  it("el menú de Administración incluye el enlace y ninguna fila queda en «Pronto»", () => {
    for (const r of ["platform_superadmin", "tenant_admin"]) {
      const secs = ver([rol(r, "platform")], []);
      expect(hrefs(secs.flatMap((s) => s.children))).toContain("/admin/real-estate");
      expect(secs.flatMap((s) => s.children).some((i) => i.pronto)).toBe(false);
      expect(entradasBuscador(secs).some((e) => e.href === "/admin/real-estate")).toBe(true);
    }
  });

  it("se pinta como enlace, sin marca «Pronto»", () => {
    const antes = mockAuth.allRoles;
    mockAuth.allRoles = [{ core_name: "platform", role_key: "tenant_admin" }];
    mockPath = "/settings";
    try {
      render(<ForgeGlobalCoresSidebar mobileOpen={false} />);
      expect(document.querySelector('[data-pronto="/admin/real-estate"]')).toBeNull();
      const el = document.querySelector('a[href="/admin/real-estate"]')!;
      expect(el).not.toBeNull();
      expect(el).toHaveTextContent("Real Estate");
      expect(el).not.toHaveTextContent("Pronto");
    } finally {
      mockAuth.allRoles = antes;
    }
  });
});
