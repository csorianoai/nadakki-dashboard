/**
 * Registro de los OCHO módulos de la Suite (PR 6a). Una sola fuente: el menú de cada módulo se DERIVA de
 * lib/navigation.ts (la sección que le corresponde) o de la fuente propia del core cuando ya tiene la suya
 * (Dealer OS, Real Estate, bank-v2, pestañas de Marketing). Aquí no se copia ninguna ruta a mano, salvo los
 * prefijos de pertenencia.
 *
 * La visibilidad REUTILIZA `filterSectionsForUser` (módulos del tenant + rol): el registro no la reescribe.
 */
import { BookOpen, Building2, Car, Landmark, Megaphone, Scale, Settings } from "lucide-react";
import { BANCO_V2_NAV, BANCO_V2_RAIZ } from "@/app/(forge)/credit-hub/bank-v2/_nav";
import { DEALER_NAV_GROUPS, isDealerNavItemOpenable } from "@/components/dealer-management/shell/dealer-nav";
import {
  NAV_SECTIONS,
  filterSectionsForUser,
  userCanAccessAdminNav,
} from "@/components/forge/layout/forge-global-sidebar-nav";
import type { RoleInfo } from "@/lib/api/auth-v2";
import { ICONO_PESTANA, NAVEGACION, PESTANAS_MARKETING, PREFIJOS_MARKETING, ROLES_ADMINISTRACION, type NavItem, type NavSection } from "@/lib/navigation";
import { ALL_CENTERS, OFF_BAR_CENTERS, REALTOR_CENTERS } from "@/lib/realtor/centers";
import { DESCRIPCIONES } from "./descripciones";
import type { CarcasaCore, GrupoMenu, ItemMenu, ModuloConfig } from "./tipos";

export type { CarcasaCore, GrupoMenu, ItemMenu, ModuloConfig } from "./tipos";

// ── Derivación de menús ────────────────────────────────────────────────────────────────────────────

const titulo = (s: string): string => {
  const t = s.toLowerCase().replace(/[-_]+/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const seccionDe = (id: string): NavSection => {
  const sec = NAVEGACION.find((s) => s.id === id);
  if (!sec) throw new Error(`lib/modulos: no existe la sección ${id} en lib/navigation.ts`);
  return sec;
};

function aItem(it: NavItem): ItemMenu {
  return {
    id: it.id,
    label: it.label,
    href: it.href ?? "",
    pronto: it.href ? undefined : it.pronto,
    icono: it.icon,
    roles: it.roles,
    badge: it.badge,
    featureFlag: it.featureFlag,
    coreMatchers: it.coreMatchers,
    superAdminOnly: it.superAdminOnly,
    acceso: it.acceso,
    sinModulo: it.sinModulo,
    keywords: it.keywords,
    descripcion: DESCRIPCIONES[it.id],
  };
}

type ReglaGrupo = { label: string; prefijos: string[] };

/** Reparte las páginas de la sección en grupos por prefijo de ruta; lo que ninguna regla reclama va al primero. */
function desdeSeccion(seccionId: string, general: string, reglas: ReglaGrupo[] = []): GrupoMenu[] {
  const items = seccionDe(seccionId).children.filter((c) => c.href || c.pronto).map(aItem);
  const grupos: GrupoMenu[] = [{ id: `${seccionId}-general`, label: general, items: [] }];
  for (const r of reglas) grupos.push({ id: `${seccionId}-${r.label.toLowerCase().replace(/\W+/g, "-")}`, label: r.label, items: [] });
  for (const it of items) {
    const h = it.href || it.pronto || "";
    const i = reglas.findIndex((r) => r.prefijos.some((p) => h === p || h.startsWith(`${p}/`) || h.startsWith(`${p}?`)));
    grupos[i < 0 ? 0 : i + 1].items.push(it);
  }
  return grupos.filter((g) => g.items.length > 0);
}

const deMarketing: GrupoMenu[] = PESTANAS_MARKETING.map((p) => ({
  id: `marketing-${p.id}`,
  label: p.label,
  icono: ICONO_PESTANA[p.id],
  // Lo que PestanasMarketing resolvía por prefijo (rutas de la pestaña que no son item del menú; "/marketing" cae en la primera).
  prefijos: p.id === PESTANAS_MARKETING[0]!.id ? [...p.prefijos, "/marketing"] : p.prefijos,
  items: p.paginas.map((pg) => {
    const id = `mkt-${p.id}-${pg.href}`;
    return { id, label: pg.label, href: pg.href, keywords: pg.keywords, descripcion: DESCRIPCIONES[id] };
  }),
}));

/**
 * Menú del Dealer OS: el de su carcasa (DEALER_NAV_GROUPS), con las MISMAS reglas que visibleDealerNavGroups: solo
 * enlaces que se abren desde el panel (no rebotan) y la capability del plan, que aplica ModuleShell (PS-9-CARCASAS-2).
 * `sinModulo`: el dealer nunca se filtró por cores del tenant, solo por el plan; su menú no pasa por ese filtro.
 */
const deDealer: GrupoMenu[] = DEALER_NAV_GROUPS.map((g) => ({
  id: `dealer-${g.id}`,
  label: g.label,
  items: g.items
    .filter((it) => isDealerNavItemOpenable(it.href))
    .map((it) => ({ id: `dealer-${it.href}`, label: it.label, href: it.href, icono: it.icon, capability: it.capability, sinModulo: true })),
})).filter((g) => g.items.length > 0);

/**
 * Centros de Real Estate agrupados como su barra lateral (se leen de lib/realtor/centers.ts). Los centros con ruta
 * que no son fila (OFF_BAR_CENTERS, p. ej. Propietarios) cuelgan de su grupo real; los bloques fijos de la barra
 * (Smart Calendar) no tienen grupo: cada uno es su propio bloque, con su rótulo, sin grupo inventado.
 */
const deRealtor: GrupoMenu[] = (() => {
  const porGrupo = new Map<string, ItemMenu[]>();
  for (const c of [...REALTOR_CENTERS, ...OFF_BAR_CENTERS]) {
    if (!c.href) continue;
    porGrupo.set(c.group, [...(porGrupo.get(c.group) ?? []), { id: `realtor-${c.id}`, label: c.label, href: c.href, sinModulo: true }]);
  }
  const enBarra = (id: string) => [...REALTOR_CENTERS, ...OFF_BAR_CENTERS].some((r) => r.id === id);
  // El rótulo de los bloques fijos vive en la barra (ShellSidebar), no en centers.ts.
  const rotuloFijo = (id: string) => (id === "smart-calendar" ? "Smart Calendar" : titulo(id));
  const fijos: GrupoMenu[] = ALL_CENTERS.filter((c) => c.href && !enBarra(c.id)).map((c) => ({
    id: `realtor-${c.id}`,
    label: rotuloFijo(c.id),
    items: [{ id: `realtor-${c.id}`, label: rotuloFijo(c.id), href: c.href as string, sinModulo: true }],
  }));
  return [
    ...Array.from(porGrupo, ([label, items]) => ({ id: `realtor-${label.toLowerCase().replace(/\W+/g, "-")}`, label: titulo(label), items })),
    ...fijos,
  ];
})();

const sinIconos = (g: GrupoMenu[]) => g.map((x) => ({ label: x.label, items: x.items.map((i) => ({ label: i.label, href: i.href, ...("capability" in i ? { capability: (i as { capability?: string | null }).capability } : {}) })) }));

// ── Los ocho módulos ───────────────────────────────────────────────────────────────────────────────

export const MODULOS: ModuloConfig[] = [
  {
    id: "concesionarios",
    label: "Concesionarios",
    icono: Car,
    raiz: "/autos/dealer",
    prefijos: ["/autos/dealer", "/centro-operativo"],
    coreMatchers: seccionDe("concesionarios").coreMatchers,
    roles: [],
    seccion: "concesionarios",
    menu: deDealer,
    acento: "#38bdf8",
    // PS-9-CARCASAS-2: el Dealer OS y el Centro Operativo abren sobre ModuleShell; DealerShell ya no pinta su menú ni su
    // barra (los da el armazón) y conserva sincronización, avisos, tema y acciones. Sin pantallas /grupo: no existen.
    carcasa: "comun",
    sinPantallaGrupo: true,
    compartidas: ["/contable", "/marketing/campaigns"],
    carcasas: [{ prefijos: ["/autos/dealer", "/centro-operativo"], modulo: { label: "Dealer OS", href: "/autos/dealer" }, grupos: sinIconos(deDealer) }],
  },
  {
    id: "credito",
    label: "Crédito",
    icono: Landmark,
    raiz: "/credit-hub",
    prefijos: ["/credit-hub", "/credit", "/sic", "/market-intel"],
    coreMatchers: seccionDe("credit-hub").coreMatchers,
    roles: [],
    seccion: "credit-hub",
    menu: desdeSeccion("credit-hub", "Crédito", [
      { label: "Banco", prefijos: ["/credit-hub/bank-v2"] },
      { label: "Concesionario", prefijos: ["/autos/dealer/credito"] },
      { label: "SIC", prefijos: ["/sic"] },
    ]),
    acento: "#34d399",
    carcasa: "comun",
    sinPantallaGrupo: true,
    // PS-9-CARCASAS-1: Credit Hub y el panel legado del banco (ChAppShell) ya usan ModuleShell; PS-9-CARCASAS-2: también
    // bank-v2 (BancoV2Shell sin el menú ni la barra de DccShell). Conservan su carcasa el portal del concesionario
    // (DealerChShell), el cockpit, Monetización (MonetizacionShell) y SIC.
    propias: ["/credit-hub/dealer", "/credit-hub/admin", "/credit-hub/monetizacion", "/sic", "/market-intel"],
    compartidas: ["/autos/dealer/credito"],
    carcasas: [
      { prefijos: [BANCO_V2_RAIZ], modulo: { label: "Banco", href: BANCO_V2_RAIZ }, grupos: BANCO_V2_NAV.map((g) => ({ label: g.label, items: g.items.map((i) => ({ label: i.label, href: i.href })) })) },
      { prefijos: ["/credit-hub/dealer"], modulo: { label: "Crédito del concesionario", href: "/credit-hub/dealer" }, grupos: [] },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icono: Megaphone,
    raiz: "/marketing-hub",
    prefijos: Array.from(new Set(PREFIJOS_MARKETING)),
    coreMatchers: seccionDe("marketing-hub").coreMatchers,
    roles: [],
    seccion: "marketing-hub",
    menu: deMarketing,
    acento: "#4ade80",
    carcasa: "comun",
  },
  {
    id: "contabilidad",
    label: "Contabilidad",
    icono: BookOpen,
    raiz: "/contable/resumen",
    prefijos: ["/contable"],
    coreMatchers: seccionDe("contable-hub").coreMatchers,
    roles: [],
    seccion: "contable-hub",
    menu: desdeSeccion("contable-hub", "Contabilidad"),
    acento: "#fbbf24",
    // PS-9-CARCASAS-3: quien no es dealer abre Contabilidad sobre ModuleShell (antes GlobalForgeAppShell); el dealer, sobre
    // Concesionarios (ContableChrome). Sin pantallas /contable/grupo: no existen.
    carcasa: "comun",
    sinPantallaGrupo: true,
  },
  {
    id: "legal",
    label: "Legal",
    icono: Scale,
    raiz: "/legal",
    prefijos: ["/legal"],
    coreMatchers: seccionDe("legal-hub").coreMatchers,
    roles: [],
    seccion: "legal-hub",
    menu: desdeSeccion("legal-hub", "Legal"),
    acento: "#a78bfa",
    carcasa: "comun",
  },
  {
    id: "proyectos",
    label: "Proyectos",
    icono: Building2,
    raiz: "/proyectos",
    prefijos: ["/proyectos"],
    coreMatchers: seccionDe("projects-hub").coreMatchers,
    roles: [],
    seccion: "projects-hub",
    menu: desdeSeccion("projects-hub", "Proyectos"),
    acento: "#fb923c",
    carcasa: "comun",
  },
  {
    id: "real-estate",
    label: "Real Estate",
    icono: Building2,
    raiz: "/realtor",
    prefijos: ["/realtor"],
    coreMatchers: seccionDe("real-estate").coreMatchers,
    roles: [],
    seccion: "real-estate",
    menu: deRealtor,
    acento: "#f472b6",
    carcasa: "propia",
    acceso: "realtor",
    carcasas: [{ prefijos: ["/realtor"], modulo: { label: "Realtor OS", href: "/realtor" }, grupos: sinIconos(deRealtor) }],
  },
  {
    id: "administracion",
    label: "Administración",
    icono: Settings,
    raiz: "/admin",
    prefijos: ["/admin", "/settings", "/billing", "/audit", "/feature-flags", "/cockpit"],
    coreMatchers: seccionDe("admin").coreMatchers,
    roles: [...ROLES_ADMINISTRACION],
    seccion: "admin",
    menu: desdeSeccion("admin", "Plataforma", [{ label: "Cuenta", prefijos: ["/settings", "/billing", "/audit"] }]),
    acento: "#94a3b8",
    carcasa: "comun",
    pantallaGrupoSoloSuperadmin: true, // /admin/** lo envuelve SoloSuperadminDePlataforma (app/admin/layout.tsx)
    propias: ["/cockpit"],
    carcasas: [{ prefijos: ["/cockpit"], modulo: { label: "Cockpit", href: "/cockpit" }, grupos: [] }],
  },
];

// ── Consultas ──────────────────────────────────────────────────────────────────────────────────────

export function sinQuery(href: string): string {
  return href.split(/[?#]/)[0] || "/";
}

const bajo = (ruta: string, prefijo: string) => ruta === prefijo || ruta.startsWith(`${prefijo}/`);

/** Módulo al que pertenece la ruta: gana el prefijo más largo. `null` si ninguno (rutas sueltas, 404). */
export function moduloDeRuta(pathname: string | null | undefined): ModuloConfig | null {
  const ruta = sinQuery(pathname || "/").replace(/\/+$/, "") || "/";
  let mejor: ModuloConfig | null = null;
  let largo = -1;
  for (const m of MODULOS) {
    for (const p of m.prefijos) {
      if (bajo(ruta, p) && p.length > largo) [mejor, largo] = [m, p.length];
    }
  }
  return mejor;
}

/** ¿Esta ruta se pinta con ModuleShell? Módulo de carcasa común y fuera de sus rutas con carcasa propia. */
export function usaCarcasaComun(pathname: string | null | undefined): boolean {
  const m = moduloDeRuta(pathname);
  if (!m || m.carcasa !== "comun") return false;
  const ruta = sinQuery(pathname || "/");
  return !(m.propias ?? []).some((p) => bajo(ruta, p));
}

export type ContextoUsuario = { roles: RoleInfo[]; subscribedCores?: string[]; realtorOk?: boolean };

/**
 * Módulos que ESTE usuario ve: exactamente las secciones que deja pasar `filterSectionsForUser` (la misma
 * función del menú lateral de la Suite), más la puerta propia de Real Estate.
 */
export function modulosVisibles(u: ContextoUsuario): ModuloConfig[] {
  const showAdmin = userCanAccessAdminNav(u.roles);
  const ids = new Set(
    filterSectionsForUser(NAV_SECTIONS, u.roles, u.subscribedCores, showAdmin)
      .filter((s) => s.acceso !== "realtor" || u.realtorOk === true)
      .map((s) => s.id),
  );
  return MODULOS.filter((m) => ids.has(m.seccion));
}

/** Menú del módulo para este usuario: se pasa por el MISMO filtro (módulo del tenant, rol, interruptores). */
export function menuVisible(m: ModuloConfig, u: ContextoUsuario): GrupoMenu[] {
  const items = m.menu.flatMap((g) => g.items);
  const seccion: NavSection = {
    id: m.seccion,
    label: m.label,
    icon: m.icono,
    coreMatchers: m.coreMatchers,
    children: items.map((i): NavItem => ({ id: i.id, label: i.label, href: i.href || undefined, pronto: i.pronto, icon: i.icono, roles: i.roles, badge: i.badge, featureFlag: i.featureFlag, coreMatchers: i.coreMatchers, superAdminOnly: i.superAdminOnly, sinModulo: i.sinModulo })),
  };
  const [filtrada] = filterSectionsForUser([seccion], u.roles, u.subscribedCores, userCanAccessAdminNav(u.roles));
  const quedan = new Set((filtrada?.children ?? []).map((c) => c.id));
  // Misma puerta que las secciones (modulosVisibles): una fila de Real Estate solo con 200 de /acceso.
  const pasa = (i: ItemMenu) => quedan.has(i.id) && (i.acceso !== "realtor" || u.realtorOk === true);
  return m.menu.map((g) => ({ ...g, items: g.items.filter(pasa) })).filter((g) => g.items.length > 0);
}

// ── Grupos del menú: pantalla del grupo y pestañas ─────────────────────────────────────────────────

/** `/<raiz>/grupo/<id>`: la pantalla de un grupo (tarjetas con todas sus páginas). */
const PANTALLA_GRUPO = /^\/[^/]+\/grupo\/([^/]+)$/;

/** Grupo con al menos una página enlazable: los grupos solo de filas «Pronto» (sin href) no cuentan como grupo con pantalla. */
export const grupoEnlazable = (g: GrupoMenu): boolean => g.items.some((i) => !!i.href);

/**
 * ¿Este módulo muestra pantalla de grupo? Solo con ModuleShell y con más de un grupo ENLAZABLE; el menú plano no la
 * tiene. Las pantallas de grupo de Administración viven bajo /admin/**, que es solo de platform_superadmin
 * (app/admin/layout.tsx): para cualquier otro rol (tenant_admin) NO hay pantalla de grupo ni enlaces a ella, porque
 * llevarían a «Acceso no autorizado». No se amplía ningún permiso. `esSuperadmin` por defecto es true para quien solo
 * necesita las etiquetas (migas); el armazón lo pasa siempre explícito.
 */
export function tienePantallaGrupo(m: ModuloConfig, grupos: GrupoMenu[] = m.menu, esSuperadmin = true): boolean {
  if (m.sinPantallaGrupo || (m.pantallaGrupoSoloSuperadmin && !esSuperadmin)) return false;
  return m.carcasa === "comun" && grupos.filter(grupoEnlazable).length > 1;
}

/** URL estable de la pantalla de un grupo: `<raiz del módulo>/grupo/<id del grupo>`. */
export function rutaGrupo(m: ModuloConfig, g: GrupoMenu): string {
  return `${m.raiz}/grupo/${g.id}`;
}

/** Grupo cuya pantalla es esta ruta, si lo es. */
export function grupoDePantalla(m: ModuloConfig, grupos: GrupoMenu[], pathname: string | null | undefined): GrupoMenu | null {
  const ruta = sinQuery(pathname || "/").replace(/\/+$/, "");
  if (!ruta.startsWith(`${m.raiz}/grupo/`) || !PANTALLA_GRUPO.test(ruta)) return null;
  let id: string;
  try {
    id = decodeURIComponent(PANTALLA_GRUPO.exec(ruta)![1]!);
  } catch {
    return null; // URL mal formada (%E0%A4%A): no es ningún grupo, en vez de tumbar la carcasa
  }
  return grupos.find((g) => g.id === id) ?? null;
}

/** Grupo al que pertenece la ruta: por su item activo; si no es item, por el prefijo más largo del grupo. */
export function grupoDeRuta(grupos: GrupoMenu[], pathname: string | null | undefined): GrupoMenu | null {
  const it = itemActivo(grupos, pathname);
  if (it) return grupos.find((g) => g.items.some((i) => i.id === it.id)) ?? null;
  const ruta = sinQuery(pathname || "/");
  let mejor: GrupoMenu | null = null;
  let largo = -1;
  for (const g of grupos) for (const p of g.prefijos ?? []) if (bajo(ruta, p) && p.length > largo) [mejor, largo] = [g, p.length];
  return mejor;
}

/** Item activo: el de href MÁS específico (más largo) que cubre la ruta. */
export function itemActivo(grupos: GrupoMenu[], pathname: string | null | undefined): ItemMenu | null {
  const ruta = sinQuery(pathname || "/");
  if (PANTALLA_GRUPO.test(ruta.replace(/\/+$/, ""))) return null; // la pantalla de un grupo no es ninguna de sus páginas
  let mejor: ItemMenu | null = null;
  for (const g of grupos) {
    for (const it of g.items) {
      if (!it.href) continue;
      const h = sinQuery(it.href);
      if ((ruta === h || (h !== "/" && ruta.startsWith(`${h}/`))) && (!mejor || h.length >= sinQuery(mejor.href).length)) mejor = it;
    }
  }
  return mejor;
}
