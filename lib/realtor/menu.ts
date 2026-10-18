import { OFF_BAR_CENTERS, REALTOR_CENTERS, type RealtorCenter } from "./centers";

/** Rol del backend que habilita la Bandeja del broker. Lo decide el backend; el menú solo lo refleja. */
export const BROKER_ROLE = "broker_supervisor";

export type MenuItem = RealtorCenter & { requiresRole?: string };
export type MenuGroup = { id: string; label: string; items: readonly MenuItem[] };

/** Bandeja del broker: entrada del bloque «Hoy», solo por rol. */
const BROKER_DESK: MenuItem = { id: "bandeja-broker", label: "Bandeja del broker", group: "HOY", href: "/realtor/broker", requiresRole: BROKER_ROLE };

/**
 * Filas de la barra que no son centros: Alta y Agente web (decisión de César 2026-10-16, auditoría de Cowork). Viven aquí y no en
 * REALTOR_CENTERS porque este deriva las migas de la Suite (lib/modulos/registro.ts, zona DASH-NAV), que las espera sin grupo.
 * Entran en CRECER justo antes de Academia (el manifiesto solo las clasifica como módulo real-estate).
 */
const BAR_ONLY_ROWS: readonly MenuItem[] = [
  { id: "alta", label: "Alta", group: "CRECER", href: "/realtor/alta" },
  { id: "agente-web", label: "Agente web", group: "CRECER", href: "/realtor/agente-web" },
];

function build(): MenuGroup[] {
  const groups: MenuGroup[] = [];
  const all: MenuItem[] = [...REALTOR_CENTERS];
  all.splice(all.findIndex((c) => c.group === "HOY") + 1, 0, BROKER_DESK);
  all.splice(all.findIndex((c) => c.id === "academia"), 0, ...BAR_ONLY_ROWS);
  for (const c of all) {
    const last = groups[groups.length - 1];
    if (last && last.label === c.group) (last.items as MenuItem[]).push(c);
    else groups.push({ id: c.group.toLowerCase(), label: c.group, items: [c] });
  }
  return groups;
}

/** Estructura de la barra lateral: cuatro grupos, ninguno «Próximamente». Única fuente para la barra, las pruebas y el spec. */
export const REALTOR_MENU: readonly MenuGroup[] = build();

/** Rutas de /realtor que no son fila de la barra, con su motivo. Las pruebas exigen que toda page.tsx esté aquí o en el menú. */
export const OFF_MENU_ROUTES: readonly { href: string; reason: string }[] = [
  { href: "/realtor", reason: "Inicio del armazón: la barra no lo lista." },
  ...OFF_BAR_CENTERS.filter((c) => c.href).map((c) => ({ href: c.href as string, reason: "Se llega desde Contactos (rol de propietario)." })),
  { href: "/realtor/smart-calendar", reason: "Bloque fijo de la barra (Smart Calendar)." },
  { href: "/realtor/demand-radar/senales", reason: "Subpágina de Mercado (Señales de mercado): oculta sin entitlement y, por ahora, solo se abre por URL." },
  { href: "/realtor/property-intel/[propertyId]", reason: "Ficha de detalle de una propiedad o unidad: se abre por URL con su identificador, no es un destino de la barra." },
];

/** Grupos visibles: oculta lo que exige un rol que no se tiene (fail-closed) y filtra por nombre. */
export function visibleMenu(roles: readonly string[], query = ""): MenuGroup[] {
  const q = query.trim().toLowerCase();
  return REALTOR_MENU
    .map((g) => ({ ...g, items: g.items.filter((i) => (!i.requiresRole || roles.includes(i.requiresRole)) && (!q || i.label.toLowerCase().includes(q))) }))
    .filter((g) => g.items.length > 0);
}
