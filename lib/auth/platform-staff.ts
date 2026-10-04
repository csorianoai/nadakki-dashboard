/**
 * Personal de la PLATAFORMA — Nadakki — frente a usuarios de un tenant.
 *
 * Existe porque esa distincion estaba confundida en un solo sitio y de ahi
 * colgaban tres hallazgos. `userCanAccessAdminNav`
 * (components/forge/layout/forge-global-sidebar-nav.ts:87) devuelve `true` para
 * `tenant_admin`, y con eso un administrador DE SU TENANT quedaba tratado como
 * administrador DE LA PLATAFORMA.
 *
 * Verificado por Cesar en produccion con cajamapaal+carolina: un usuario de
 * Mapaal veia la Suite operativa con Administracion dentro, las metricas de
 * plataforma --"Agentes 33", "Tenants", "Dominios 20"-- y la pantalla /tenants,
 * que ademas lista cuatro tenants inventados con API keys falsas (hallazgo del
 * auditor 2).
 *
 * `tenant_admin` NO entra aqui, y es la decision entera de este modulo: manda
 * dentro de su tenant y nada mas. Que la lista de abajo sea corta no es un
 * descuido: es lo que significa "personal de la plataforma".
 *
 * Esto NO sustituye al control del backend. Es el frontend restringiendo lo que
 * pinta; el servidor sigue siendo el que concede.
 */

/** Lo minimo que se necesita de un rol. Sirve igual para `RoleInfo`. */
export type RolParaPlataforma = { core_name: string; role_key: string };

/** Superadmin de plataforma: manda en todo. */
const SUPERADMIN = "platform_superadmin";

/** Soporte, pero solo el del core `platform`. */
const SOPORTE_DE_PLATAFORMA = { core_name: "platform", role_key: "support_agent" };

/**
 * `true` solo si el usuario es personal de Nadakki.
 *
 * Fail-closed por construccion: sin roles, con roles vacios o con cualquier rol
 * de tenant --`tenant_admin` incluido-- devuelve `false`. Lo que no se reconoce
 * no se concede.
 */
export function esPersonalDePlataforma(roles: RolParaPlataforma[] | null | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some(
    (r) =>
      r.role_key === SUPERADMIN ||
      (r.core_name === SOPORTE_DE_PLATAFORMA.core_name &&
        r.role_key === SOPORTE_DE_PLATAFORMA.role_key),
  );
}

/** El texto que ve quien no es personal de plataforma. Dice el motivo, sin culpar. */
export const SOLO_PLATAFORMA_TITULO = "Esta pantalla es de la plataforma";
export const SOLO_PLATAFORMA_DETALLE =
  "La administración de tenants es de Nadakki, no de tu institución. Si necesitás un cambio en tu tenant, escribinos.";
