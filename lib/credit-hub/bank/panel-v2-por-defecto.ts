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
