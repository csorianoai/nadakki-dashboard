/**
 * Migas de pan de la barra de la Suite: Inicio › Módulo › Sección › Pantalla, cada nivel con enlace.
 *
 * Fuente: los menús que ya existen, nada escrito a mano por pantalla. Los cores con menú propio (banco,
 * Dealer OS, Realtor OS) se leen de su menú; el resto, de lib/navigation.ts (fuente única de la Suite) y de
 * las pestañas de Marketing. Una ruta que ningún menú conoce cae a Inicio › primer segmento › pantalla.
 */
import { BANCO_V2_NAV, BANCO_V2_RAIZ } from "@/app/(forge)/credit-hub/bank-v2/_nav";
import { DEALER_NAV_GROUPS } from "@/components/dealer-management/shell/dealer-nav";
import { ALL_CENTERS, REALTOR_CENTERS } from "@/lib/realtor/centers";
import { NAVEGACION, PESTANAS_MARKETING, type NavItem } from "@/lib/navigation";

export type Miga = { label: string; href: string };

export const INICIO: Miga = { label: "Inicio", href: "/" };

type Grupo = { label: string; items: { label: string; href: string }[] };
type MenuCore = { prefijos: string[]; modulo: Miga; grupos: Grupo[] };

const CENTROS_REALTOR: Grupo[] = (() => {
  const porGrupo = new Map<string, { label: string; href: string }[]>();
  for (const c of REALTOR_CENTERS) {
    if (!c.href) continue;
    porGrupo.set(c.group, [...(porGrupo.get(c.group) ?? []), { label: c.label, href: c.href }]);
  }
  const fijos = ALL_CENTERS.filter((c) => c.href && !REALTOR_CENTERS.some((r) => r.id === c.id)).map((c) => ({
    label: c.id === "career-director" ? "Career Director" : c.id === "smart-calendar" ? "Smart Calendar" : c.id,
    href: c.href as string,
  }));
  return [...Array.from(porGrupo, ([label, items]) => ({ label: titulo(label), items })), { label: "Herramientas", items: fijos }];
})();

/** Cores con carcasa y menú propios. El orden no importa: gana el prefijo más largo. */
export const MENUS_CORE: MenuCore[] = [
  { prefijos: [BANCO_V2_RAIZ], modulo: { label: "Banco", href: BANCO_V2_RAIZ }, grupos: BANCO_V2_NAV },
  {
    prefijos: ["/autos/dealer", "/centro-operativo"],
    modulo: { label: "Dealer OS", href: "/autos/dealer" },
    grupos: DEALER_NAV_GROUPS,
  },
  { prefijos: ["/realtor"], modulo: { label: "Realtor OS", href: "/realtor" }, grupos: CENTROS_REALTOR },
  { prefijos: ["/credit-hub/bank"], modulo: { label: "Banco", href: "/credit-hub/bank" }, grupos: [] },
  { prefijos: ["/credit-hub/dealer"], modulo: { label: "Crédito del concesionario", href: "/credit-hub/dealer" }, grupos: [] },
  { prefijos: ["/cockpit"], modulo: { label: "Cockpit", href: "/cockpit" }, grupos: [] },
];

function titulo(s: string): string {
  const t = s.toLowerCase().replace(/[-_]+/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function sinQuery(href: string): string {
  return href.split(/[?#]/)[0] || "/";
}

/** `href` cubre `ruta`: exacto, o como prefijo de segmento (salvo la raíz del módulo, que solo cuenta exacta). */
function cubre(href: string, ruta: string, raiz?: string): boolean {
  const h = sinQuery(href);
  if (h === "/" || h === raiz) return ruta === h;
  return ruta === h || ruta.startsWith(`${h}/`);
}

function prefijoDe(prefijos: string[], ruta: string): number {
  return Math.max(-1, ...prefijos.filter((p) => ruta === p || ruta.startsWith(`${p}/`)).map((p) => p.length));
}

/** Pantalla final: la propia ruta cuando es más profunda que la entrada del menú (p. ej. un detalle). */
function conDetalle(migas: Miga[], ultimaHref: string, ruta: string): Miga[] {
  if (sinQuery(ultimaHref) === ruta) return migas;
  const seg = ruta.split("/").filter(Boolean).pop() ?? "";
  // un identificador (uuid, número) no es un nombre: la pantalla es «Detalle»
  const label = !seg || /^[0-9a-f-]{8,}$/i.test(seg) || /^\d+$/.test(seg) ? "Detalle" : titulo(seg);
  return [...migas, { label, href: ruta }];
}

function migasCore(menu: MenuCore, ruta: string): Miga[] {
  let mejor: { grupo: Grupo; item: { label: string; href: string } } | null = null;
  for (const grupo of menu.grupos) {
    for (const item of grupo.items) {
      if (!cubre(item.href, ruta, menu.modulo.href)) continue;
      if (!mejor || sinQuery(item.href).length > sinQuery(mejor.item.href).length) mejor = { grupo, item };
    }
  }
  const base = [INICIO, menu.modulo];
  if (!mejor) {
    return ruta === menu.modulo.href ? base : conDetalle(base, menu.modulo.href, ruta);
  }
  if (sinQuery(mejor.item.href) === menu.modulo.href) return conDetalle(base, menu.modulo.href, ruta);
  const seccion = { label: mejor.grupo.label, href: mejor.grupo.items[0].href };
  const pantalla = { label: mejor.item.label, href: mejor.item.href };
  return conDetalle([...base, seccion, pantalla], pantalla.href, ruta);
}

function migasSuite(ruta: string): Miga[] | null {
  let mejor: { seccion: (typeof NAVEGACION)[number]; padre: NavItem | null; item: { label: string; href: string } } | null = null;
  const prueba = (seccion: (typeof NAVEGACION)[number], padre: NavItem | null, item: { label: string; href?: string }) => {
    if (!item.href || !cubre(item.href, ruta)) return;
    if (!mejor || sinQuery(item.href).length > sinQuery(mejor.item.href).length) {
      mejor = { seccion, padre, item: { label: item.label, href: item.href } };
    }
  };
  for (const seccion of NAVEGACION) {
    for (const it of seccion.children) {
      prueba(seccion, null, it);
      for (const hijo of it.children ?? []) prueba(seccion, it, hijo);
    }
  }
  // Marketing: Inicio › Marketing › pestaña › pantalla.
  for (const p of PESTANAS_MARKETING) {
    for (const pg of p.paginas) {
      if (!cubre(pg.href, ruta)) continue;
      const largo = sinQuery(pg.href).length;
      const actual = mejor as { item: { href: string } } | null;
      if (!actual || largo >= sinQuery(actual.item.href).length) {
        const migas = [INICIO, { label: "Marketing", href: "/marketing-hub" }, { label: p.label, href: p.href }];
        const pantalla = { label: pg.label, href: pg.href };
        return conDetalle(sinQuery(p.href) === sinQuery(pg.href) ? migas : [...migas, pantalla], pg.href, ruta);
      }
    }
  }
  if (!mejor) return null;
  const m = mejor as { seccion: (typeof NAVEGACION)[number]; padre: NavItem | null; item: { label: string; href: string } };
  if (m.seccion.id === "inicio" && sinQuery(m.item.href) === "/") return [INICIO];
  const primera = m.seccion.href ?? m.seccion.children.find((c) => c.href)?.href ?? m.item.href;
  const migas: Miga[] = [INICIO, { label: m.seccion.label, href: primera }];
  if (m.padre?.href) migas.push({ label: m.padre.label, href: m.padre.href });
  if (sinQuery(m.item.href) !== sinQuery(primera) || m.padre) migas.push(m.item);
  return conDetalle(migas, m.item.href, ruta);
}

export function migasDe(pathname: string | null): Miga[] {
  const ruta = sinQuery(pathname || "/").replace(/\/+$/, "") || "/";
  if (ruta === "/") return [INICIO];
  let core: MenuCore | null = null;
  let largo = -1;
  for (const m of MENUS_CORE) {
    const l = prefijoDe(m.prefijos, ruta);
    if (l > largo) [core, largo] = [m, l];
  }
  if (core) return migasCore(core, ruta);
  const suite = migasSuite(ruta);
  if (suite) return suite;
  const partes = ruta.split("/").filter(Boolean);
  const modulo = { label: titulo(partes[0]), href: `/${partes[0]}` };
  return conDetalle([INICIO, modulo], modulo.href, ruta);
}
