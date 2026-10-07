import { isBankV2DefaultEnabled } from "@/lib/env/feature-bank-v2-default";

/** Raiz del panel nuevo del banco. */
export const PANEL_BANCO_V2 = "/credit-hub/bank-v2";

/** Roles de banco a los que el interruptor cambia el destino y el menu. */
export const ROLES_PANEL_BANCO_V2 = ["credit_admin", "banker", "bank_analyst"] as const;

/**
 * Quedan FUERA en cualquier caso, aunque ademas tengan un rol de banco:
 * superadmin (ve todos los hubs) y dealer (Mapaal y el resto de dealers).
 */
const ROLES_EXCLUIDOS = ["platform_superadmin", "dealer"] as const;

/**
 * True solo con el interruptor encendido Y un usuario de banco que no sea
 * superadmin ni dealer. Con el interruptor apagado devuelve false siempre.
 */
export function aplicaPanelBancoV2(roles: ReadonlyArray<{ role_key: string }>): boolean {
  if (!isBankV2DefaultEnabled()) return false;
  const claves = new Set(roles.map((r) => r.role_key));
  if (ROLES_EXCLUIDOS.some((k) => claves.has(k))) return false;
  return ROLES_PANEL_BANCO_V2.some((k) => claves.has(k));
}

/**
 * Pantalla del panel actual → su pantalla en bank-v2. Solo pares que existen
 * en los dos lados (el test lo comprueba contra BANCO_V2_NAV).
 */
export const RUTA_V2_POR_RUTA_BANCO: Readonly<Record<string, string>> = {
  "/credit-hub/bank": PANEL_BANCO_V2,
  "/credit-hub/bank/applications": `${PANEL_BANCO_V2}/solicitudes`,
  "/credit-hub/bank/escalations": `${PANEL_BANCO_V2}/escalaciones`,
  "/credit-hub/bank/analytics": `${PANEL_BANCO_V2}/analitica`,
  "/credit-hub/bank/compliance": `${PANEL_BANCO_V2}/cumplimiento`,
  "/credit-hub/bank/audit": `${PANEL_BANCO_V2}/auditoria`,
  "/credit-hub/bank/vehicles": `${PANEL_BANCO_V2}/vehiculos`,
  "/credit/bank/kpis": `${PANEL_BANCO_V2}/kpis`,
  "/credit/pool-filters": `${PANEL_BANCO_V2}/filtros`,
};

const DETALLE_SOLICITUD = /^\/credit-hub\/bank\/applications\/([^/]+)$/;

/**
 * Pantalla de bank-v2 equivalente a la ruta actual del panel viejo. Detalle de
 * solicitud → su expediente en bank-v2; sin equivalente → raiz de bank-v2.
 */
export function equivalenteBancoV2(pathname: string): string {
  const ruta = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const directa = RUTA_V2_POR_RUTA_BANCO[ruta];
  if (directa) return directa;
  const detalle = DETALLE_SOLICITUD.exec(ruta);
  if (detalle) return `${PANEL_BANCO_V2}/solicitudes/${detalle[1]}`;
  return PANEL_BANCO_V2;
}
