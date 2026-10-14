import { OFF_BAR_CENTERS, REALTOR_CENTERS, type RealtorCenter } from "./centers";

/** Rol del backend que habilita la Bandeja del broker. Lo decide el backend; el menú solo lo refleja. */
export const BROKER_ROLE = "broker_supervisor";

export type MenuItem = RealtorCenter & { requiresRole?: string };
export type MenuGroup = { id: string; label: string; items: readonly MenuItem[] };

/** Bandeja del broker: entrada del bloque «Hoy», solo por rol. Sin ruta de bandeja en esta base: sin href y con «Pronto». */
const BROKER_DESK: MenuItem = { id: "bandeja-broker", label: "Bandeja del broker", group: "HOY", requiresRole: BROKER_ROLE };

function build(): MenuGroup[] {
  const groups: MenuGroup[] = [];
  const all: MenuItem[] = [...REALTOR_CENTERS];
  all.splice(all.findIndex((c) => c.group === "HOY") + 1, 0, BROKER_DESK);
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
  { href: "/realtor/alta", reason: "Se llega desde Administración › Real Estate (/admin/real-estate)." },
  { href: "/realtor/agente-web", reason: "Se llega desde Administración › Real Estate (/admin/real-estate)." },
  ...OFF_BAR_CENTERS.filter((c) => c.href).map((c) => ({ href: c.href as string, reason: "Se llega desde Contactos (rol de propietario)." })),
  { href: "/realtor/smart-calendar", reason: "Bloque fijo de la barra (Smart Calendar)." },
];

/** Grupos visibles: oculta lo que exige un rol que no se tiene (fail-closed) y filtra por nombre. */
export function visibleMenu(roles: readonly string[], query = ""): MenuGroup[] {
  const q = query.trim().toLowerCase();
  return REALTOR_MENU
    .map((g) => ({ ...g, items: g.items.filter((i) => (!i.requiresRole || roles.includes(i.requiresRole)) && (!q || i.label.toLowerCase().includes(q))) }))
    .filter((g) => g.items.length > 0);
}
