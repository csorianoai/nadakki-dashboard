import { ACCESS_UNVERIFIED_MESSAGE, isAccessUnverified } from "@/lib/access/reason-codes";
import type { RoleInfo } from "@/lib/api/auth-v2";
import { isForgeMonetizacionEnabled } from "@/lib/env/feature-forge-monetizacion";
import { COCKPIT_CONSOLIDATION_FLAGS } from "@/lib/cockpit/finance-v3/flags";

import { NAVEGACION, type NavItem, type NavSection } from "@/lib/navigation";

export type { NavBadge, NavItem, NavSection } from "@/lib/navigation";

type CoreNav = {
  id: string;
  coreMatchers: string[];
};

export function userCanAccessAdminNav(allRoles: { core_name: string; role_key: string }[]): boolean {
  // Administración: solo platform_superadmin y tenant_admin (César, 2026-10-13). El soporte de plataforma
  // abre lo suyo por URL; no tiene una sección de administración en el menú.
  return allRoles.some((r) => r.role_key === "tenant_admin" || r.role_key === "platform_superadmin");
}

function hasCoreAccess(
  core: CoreNav,
  allRoles: { core_name: string }[],
  subscribed: string[] | undefined,
): boolean {
  // Fail-closed, y el ROL NO abre el core.
  //
  // Dos ramas permisivas, no una. La primera, `if (!hasSubscriptionList) return
  // true`, concedia todos los hubs cuando `subscribed_cores` venia vacia; esta
  // documentada como "permissive" en SIDEBAR_NAV_MAP.md y es la que produjo el
  // hallazgo de cajamapaal: un usuario de caja viendo todos los cores. La
  // segunda, `if (roleHit) return true`, dejaba que un rol que nombra un core
  // pintara el hub aunque el tenant no lo tuviera suscrito. Quitar solo la
  // primera deja el frontend concediendo igual, por el otro camino.
  //
  // La unica autoridad es el entitlement del tenant: el core tiene que estar en
  // `subscribed_cores`. El rol restringe DENTRO de un core ya habilitado, no lo
  // habilita. Los administradores conservan su bypass explicito en
  // `userSeesAllForgeHubSections`, que `filterSectionsForUser` evalua ANTES de
  // llamar aqui, asi que no dependen de esta rama.
  //
  // `allRoles` se conserva en la firma porque los llamadores la pasan y porque
  // el rol volvera a usarse cuando filtre dentro del core; aqui no concede.
  void allRoles;
  return (subscribed ?? []).some((c) => core.coreMatchers.includes(c));
}

export { ACCESS_UNVERIFIED_MESSAGE, isAccessUnverified } from "@/lib/access/reason-codes";
/**
 * Claves con las que el sidebar PREGUNTA si el acceso se puede verificar.
 *
 * No deciden que hub se ve --eso sale de `subscribed_cores` y de nada mas--. Son
 * una sonda: se piden al batch para leer los `reason_code` de la RESPUESTA y
 * saber si el motor pudo evaluar. Deducirlo en el cliente seria adivinar.
 *
 * Las cinco existen en `MIGRATION_097_CAPABILITY_KEYS` (lib/dealer/core-status.ts)
 * y las cinco ya se usan en el repo, asi que no se inventa ninguna:
 *
 *   credit.applications.view    DEALER_CORE_STATUS_ROWS, fila Dealer-Bank
 *   legal.cases.view            DEALER_CORE_STATUS_ROWS, fila Legal
 *   marketing.social.publish    DEALER_CORE_STATUS_ROWS, fila Marketing
 *   accounting.invoices.view    DEALER_CORE_STATUS_ROWS, fila Contable
 *   autos.inventory.list        dealer-nav.ts, Inventario
 *
 * El catalogo 097 solo cubre cinco cores: autos, marketing, legal, credit y
 * accounting. Los hubs cuyos `coreMatchers` son `nauta`, `sic`, `platform`,
 * `projects` o `admin` NO tienen clave en el catalogo y por eso no entran en la
 * sonda. No se inventa una para ellos: la sonda no necesita cubrir todos los
 * cores --un solo `reason_code` basta para saber si el motor pudo evaluar-- y la
 * visibilidad de esos hubs no cambia.
 */
export const SUITE_ACCESS_PROBE_CAPABILITIES = [
  "credit.applications.view",
  "legal.cases.view",
  "marketing.social.publish",
  "accounting.invoices.view",
  "autos.inventory.list",
] as const;


export type EmptyCoreReason = "plan" | "role" | "unverified";

/**
 * Why a core has no visible sub-items after RBAC filtering.
 *
 * `accessReasonCode` gana a todo lo demas: si el acceso no se pudo verificar, no
 * se sabe si el core esta en el plan, asi que decir "no disponible en tu plan"
 * seria una afirmacion que nadie ha medido.
 */
export function getEmptyCoreReason(
  section: NavSection,
  allRoles: RoleInfo[],
  subscribed: string[] | undefined,
  showAdmin: boolean,
  accessReasonCode?: string | null,
): EmptyCoreReason {
  if (isAccessUnverified(accessReasonCode)) {
    return "unverified";
  }
  if (section.id === "admin") {
    return "role";
  }

  const subHit = (subscribed ?? []).some((c) => section.coreMatchers.includes(c));

  // Sin el core en `subscribed_cores` el motivo es el plan, tambien cuando la
  // lista viene vacia y tambien cuando el usuario tiene el rol del core: desde
  // que el rol ya no habilita, tener el rol y no la suscripcion sigue siendo un
  // problema de plan. Decir "no tienes permisos" mandaria al usuario a pedir un
  // rol que no arregla nada.
  if (!subHit) {
    return "plan";
  }
  return "role";
}

export function getEmptyCoreMessage(reason: EmptyCoreReason): string {
  if (reason === "unverified") {
    return `${ACCESS_UNVERIFIED_MESSAGE}. No es que no tengas el módulo: no se pudo comprobar. Reintenta o avisa a soporte.`;
  }
  if (reason === "plan") {
    return "Módulo no disponible en tu plan. Contacta a tu administrador para upgrade.";
  }
  return "No tienes permisos para acceder a este módulo. Contacta a tu administrador.";
}

/** Count leaf links in a nav subtree (for grouped rendering threshold). */
export function countNavLeaves(items: NavItem[]): number {
  let n = 0;
  for (const item of items) {
    if (item.href) n += 1;
    if (item.children) n += countNavLeaves(item.children);
  }
  return n;
}

export const LARGE_CORE_LEAF_THRESHOLD = 15;

export function isPlatformSuperAdmin(allRoles: { role_key: string }[]): boolean {
  return allRoles.some((r) => r.role_key === "platform_superadmin");
}

/**
 * Administradores: dentro de un módulo ven todas sus páginas sin filtro de rol (banco y concesionario).
 * El MÓDULO no lo saltan: eso solo platform_superadmin, en `filterNavItemsForCoreAccess`.
 * Navegación, no autorización: el backend sigue decidiendo.
 */
export function userSeesAllForgeHubSections(allRoles: RoleInfo[]): boolean {
  if (isPlatformSuperAdmin(allRoles)) return true;
  return allRoles.some((r) => r.role_key === "tenant_admin");
}

export function isHrefActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavItemFeatureEnabled(item: NavItem): boolean {
  if (item.featureFlag === "forge-monetizacion") {
    return isForgeMonetizacionEnabled();
  }
  if (item.featureFlag === "cockpit-consolidation") {
    return COCKPIT_CONSOLIDATION_FLAGS.COCKPIT_CONSOLIDATION_ENABLED;
  }
  return true;
}

function filterNavItems(items: NavItem[], isSuperAdmin: boolean): NavItem[] {
  return items
    .filter((i) => !i.superAdminOnly || isSuperAdmin)
    .filter((i) => isNavItemFeatureEnabled(i))
    .map((i) => ({
      ...i,
      children: i.children ? filterNavItems(i.children, isSuperAdmin) : undefined,
    }))
    .filter((i) => i.href || i.pronto || (i.children?.length ?? 0) > 0);
}

/** `roles` de la página: role_key exacto o prefijo terminado en `*` ("bank*"). */
function tieneRolDePagina(item: NavItem, allRoles: RoleInfo[]): boolean {
  if (!item.roles?.length) return true;
  return allRoles.some((r) =>
    item.roles!.some((k) => (k.endsWith("*") ? r.role_key.startsWith(k.slice(0, -1)) : r.role_key === k)),
  );
}

function filterNavItemsForCoreAccess(
  items: NavItem[],
  isSuperAdmin: boolean,
  allRoles: RoleInfo[],
  subscribed: string[] | undefined,
  coreMatchers: string[],
  seesAllHubs: boolean,
): NavItem[] {
  return items
    .filter((i) => !i.superAdminOnly || isSuperAdmin)
    .filter((i) => isNavItemFeatureEnabled(i))
    .filter((i) => seesAllHubs || tieneRolDePagina(i, allRoles))
    .map((i) => ({
      ...i,
      children: i.children
        ? filterNavItemsForCoreAccess(
            i.children,
            isSuperAdmin,
            allRoles,
            subscribed,
            i.coreMatchers ?? coreMatchers,
            seesAllHubs,
          )
        : undefined,
    }))
    .filter((i) => {
      if (i.children && i.children.length > 0) return true;
      if (!i.href && !i.pronto) return false;
      // El módulo solo lo salta platform_superadmin: es al único al que el backend le da todos los cores
      // (auth_v2_service: superadmin → _get_all_enabled_cores; el resto → tenants.cores_enabled). tenant_admin
      // ve los módulos de SU tenant; dentro de ellos sí ve todas las páginas (bypass de rol, más arriba).
      if (i.sinModulo || isSuperAdmin) return true;
      const synthetic: CoreNav = { id: "", coreMatchers: i.coreMatchers ?? coreMatchers };
      return hasCoreAccess(synthetic, allRoles, subscribed);
    });
}

/** v2: all cores always visible; sub-items filtered by role, subscription, and super-admin flags. */
export function filterSectionsForUser(
  sections: NavSection[],
  allRoles: RoleInfo[],
  subscribed: string[] | undefined,
  showAdmin: boolean,
): NavSection[] {
  const isSuper = isPlatformSuperAdmin(allRoles);
  const seesAllHubs = userSeesAllForgeHubSections(allRoles);

  // Una sección sin páginas para este usuario no se pinta: cada uno ve solo lo suyo.
  return sections.map((sec) => {
    if (sec.id === "admin") {
      return {
        ...sec,
        children: showAdmin ? filterNavItems(sec.children, isSuper) : [],
      };
    }
    const children = filterNavItemsForCoreAccess(
      sec.children,
      isSuper,
      allRoles,
      subscribed,
      sec.coreMatchers,
      seesAllHubs,
    );
    return { ...sec, children };
  }).filter((sec) => sec.children.length > 0);
}

export function collectExpandIdsForPath(sections: NavSection[], pathname: string | null): Set<string> {
  const need = new Set<string>();
  if (!pathname) return need;

  function walkItems(items: NavItem[], parentIds: string[]): boolean {
    let any = false;
    for (const item of items) {
      const selfHit = Boolean(item.href && isHrefActive(item.href, pathname));
      const childHit = item.children ? walkItems(item.children, [...parentIds, item.id]) : false;
      if (selfHit || childHit) {
        parentIds.forEach((id) => need.add(id));
        need.add(item.id);
        any = true;
      }
    }
    return any;
  }

  for (const sec of sections) {
    if (walkItems(sec.children, [sec.id])) {
      need.add(sec.id);
    }
  }
  return need;
}

/** Árbol completo: sale de la fuente única `lib/navigation.ts`. Se filtra con `filterSectionsForUser`. */
export const NAV_SECTIONS: NavSection[] = NAVEGACION;

/** Alias de la documentación v2: el mismo árbol que {@link NAV_SECTIONS}. */
export const NAV_CORES = NAV_SECTIONS;
