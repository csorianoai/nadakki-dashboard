/**
 * Navegacion unica del panel del dealer (F2).
 *
 * Sustituye a las tres navegaciones que se solapaban en /autos/dealer:
 * el sidebar global de cores (Marketing Hub), la barra del marketplace
 * (Nadakki Auto) y el menu "Dealer Management" del layout viejo.
 *
 * Agrupacion por dominio segun el diseno aprobado y la ficha de Excursions (1.7).
 * Cada `capability` es una clave del catalogo 097 ya existente
 * (lib/dealer/core-status.ts) — aqui no se inventa ninguna.
 *
 * El frontend RESTRINGE: un item con `capability` solo se pinta si el batch de
 * entitlements lo permite. Sin respuesta, con error o cargando => no se pinta
 * (fail-closed). Nunca concede.
 */

import {
  BarChart3,
  BookOpen,
  Bell,
  Building2,
  Cable,
  Calculator,
  Car,
  Compass,
  FilePlus2,
  FileText,
  Gauge,
  LayoutDashboard,
  Landmark,
  Megaphone,
  PackagePlus,
  Paperclip,
  ListTree,
  ReceiptText,
  Scale,
  UserPlus,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { isDealerChromePath } from "@/lib/autos-portal/routes";

export type DealerNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Clave del catalogo 097. `null` = siempre visible (no depende del plan). */
  capability: string | null;
};

export type DealerNavGroup = {
  id: string;
  label: string;
  items: DealerNavItem[];
};

export const DEALER_NAV_GROUPS: DealerNavGroup[] = [
  {
    id: "operacion",
    label: "Operación",
    items: [
      { href: "/autos/dealer", label: "Inicio", icon: LayoutDashboard, capability: null },
      { href: "/autos/dealer/inventario", label: "Inventario", icon: Car, capability: "autos.inventory.list" },
      { href: "/autos/dealer/publicar-rapido", label: "Publicar", icon: PackagePlus, capability: "autos.inventory.create" },
      { href: "/autos/dealer/leads", label: "Leads", icon: Users, capability: "autos.leads.crm" },
      // El onboarding de Mapaal vive en el Centro Operativo (decision de Cesar).
      // `capability: null` a proposito: es la guia de carga y operacion, no
      // publica ningun dato del tenant --no hay importes ni cifras-- y es justo
      // lo que necesita un dealer que todavia no tiene plan ni stock. Cerrarla
      // por plan dejaria sin instrucciones a quien mas las necesita.
      { href: "/centro-operativo", label: "Centro Operativo", icon: Compass, capability: null },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    items: [
      { href: "/autos/dealer/finanzas", label: "Finanzas por vehículo", icon: Wallet, capability: "autos.inventory.list" },
      { href: "/contable", label: "Contabilidad", icon: ReceiptText, capability: "accounting.ledger.entries" },
      { href: "/contable/plan-cuentas", label: "Plan de cuentas", icon: ListTree, capability: "accounting.ledger.entries" },
      { href: "/contable/libro-mayor", label: "Libro mayor", icon: BookOpen, capability: "accounting.ledger.entries" },
      { href: "/contable/balance-comprobacion", label: "Balance", icon: Scale, capability: "accounting.reports.financial" },
      { href: "/contable/estado-resultados", label: "Estados financieros", icon: FileText, capability: "accounting.reports.financial" },
    ],
  },
  {
    id: "financiamiento",
    label: "Financiamiento",
    items: [
      // Credito del concesionario dentro de Dealer OS (/autos/dealer/credito/**, PR 2 "una sola
      // interfaz"). Antes apuntaba a /credit-hub/dealer, que DealerSuiteGate devolvia a /autos/dealer.
      { href: "/autos/dealer/credito", label: "Crédito", icon: Landmark, capability: "credit.applications.view" },
      { href: "/autos/dealer/credito/solicitudes", label: "Solicitudes", icon: Building2, capability: "credit.applications.view" },
      { href: "/autos/dealer/credito/solicitudes/nueva?new=1", label: "Nueva solicitud", icon: FilePlus2, capability: "credit.applications.submit" },
      // Pasos del asistente que el recorrido de 4 pasos no abre (codeudor y documentos) y las dos pantallas
      // de apoyo del credito (notificaciones y perfil): quedaron huerfanas tras #827 y Dealer Admin (Argentina)
      // las usa. Los pasos piden la misma capability que "Nueva solicitud" (no se amplia ningun permiso) y no
      // llevan `?new=1`, para continuar el borrador en curso en lugar de empezar uno nuevo.
      { href: "/autos/dealer/credito/solicitudes/nueva/codeudor", label: "Nueva solicitud — codeudor", icon: UserPlus, capability: "credit.applications.submit" },
      { href: "/autos/dealer/credito/solicitudes/nueva/documentos", label: "Nueva solicitud — documentos", icon: Paperclip, capability: "credit.applications.submit" },
      { href: "/autos/dealer/credito/preaprobacion", label: "Preaprobación", icon: Calculator, capability: "credit.applications.view" },
      { href: "/autos/dealer/credito/notificaciones", label: "Notificaciones", icon: Bell, capability: "credit.applications.view" },
      { href: "/autos/dealer/credito/perfil", label: "Perfil", icon: UserRound, capability: "credit.applications.view" },
    ],
  },
  {
    id: "crecimiento",
    label: "Crecimiento",
    items: [
      { href: "/marketing/campaigns", label: "Marketing", icon: Megaphone, capability: "marketing.email.campaigns" },
      { href: "/autos/dealer/insights", label: "Insights", icon: BarChart3, capability: "autos.analytics.basic" },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    items: [
      { href: "/autos/dealer/conexiones", label: "Conexiones", icon: Cable, capability: "autos.api.access" },
      { href: "/autos/dealer/estado", label: "Estado de módulos", icon: Gauge, capability: null },
    ],
  },
];

/**
 * Pantallas de la Suite que un dealer SI puede abrir (P1-3). Fuera del chrome
 * del dealer, DealerSuiteGate hace `router.replace("/autos/dealer")` salvo en
 * /contable/* (components/dealer/DealerSuiteGate.tsx): por eso Dealer-Bank,
 * Solicitudes y Marketing rebotaban aunque el plan los permitiera.
 * Un test compara esta lista con `isDealerReachableSuitePath`.
 *
 * El credito ya no necesita excepcion: vive en /autos/dealer/credito/**, dentro
 * del chrome del dealer (`isDealerChromePath`), y /credit-hub/dealer/** redirige
 * alli (next.config.js). Marketing sigue fuera: su enlace se oculta.
 */
const DEALER_REACHABLE_SUITE_PREFIXES = ["/contable"] as const;

/** true si el enlace se abre desde el panel del dealer sin que el gate lo devuelva. */
export function isDealerNavItemOpenable(href: string): boolean {
  if (isDealerChromePath(href)) return true;
  return DEALER_REACHABLE_SUITE_PREFIXES.some((prefix) => href === prefix || href.startsWith(`${prefix}/`));
}

/**
 * Lo que el menu pinta: lo que el plan permite Y se puede abrir desde el panel.
 * Un enlace que rebota no se muestra; los grupos que quedan vacios tampoco.
 */
export function visibleDealerNavGroups(allows: (capability: string | null) => boolean): DealerNavGroup[] {
  return DEALER_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isDealerNavItemOpenable(item.href) && allows(item.capability)),
  })).filter((group) => group.items.length > 0);
}

/** Claves unicas para una sola peticion de batch. */
export const DEALER_NAV_CAPABILITY_KEYS = Array.from(
  new Set(
    DEALER_NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => item.capability).filter((key): key is string => key !== null),
    ),
  ),
);

function coincidePorPrefijo(base: string, pathname: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Activo por prefijo, salvo Inicio, que solo coincide exacto. La query del enlace
 * no cuenta (Nueva solicitud lleva `?new=1`). Si otro item del menu, mas largo,
 * tambien coincide, gana ese: en /autos/dealer/credito/solicitudes se marca
 * Solicitudes y no Credito.
 */
export function isDealerNavItemActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  const base = href.split("?")[0]!;
  if (base === "/autos/dealer") return pathname === base;
  if (!coincidePorPrefijo(base, pathname)) return false;
  return !DEALER_NAV_GROUPS.flatMap((group) => group.items)
    .map((item) => item.href.split("?")[0]!)
    .some((otro) => otro.length > base.length && otro.startsWith(`${base}/`) && coincidePorPrefijo(otro, pathname));
}

/** Migas: Inicio + el item que coincide. No inventa niveles que no existen. */
export function dealerBreadcrumbFor(pathname: string | null): { label: string; href: string }[] {
  const home = { label: "Inicio", href: "/autos/dealer" };
  if (!pathname || pathname === "/autos/dealer") return [home];

  const match = DEALER_NAV_GROUPS.flatMap((group) => group.items)
    .filter((item) => item.href !== "/autos/dealer")
    .filter((item) => isDealerNavItemActive(item.href, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match ? [home, { label: match.label, href: match.href }] : [home];
}
