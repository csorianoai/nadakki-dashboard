/**
 * Admin-only gate for monetización god-view screens (P1, P2, P3).
 *
 * Gated by JWT role (platform_superadmin), NOT by tenant-id.
 * Demo mode (no auth context) falls back to tenant kind from fixture data.
 */
import { DEMO_TENANTS_DATA } from "./fixtures";
import type { TenantKind } from "./types";

/** Roles that grant operator (god-view) access to monetización. */
const OPERADOR_ROLE_KEYS = new Set(["platform_superadmin"]);

export const MONETIZACION_OPERADOR_EMPTY_MESSAGE =
  "Vista de operador · requiere rol platform_superadmin.";

export function getMonetizacionTenantKind(tenantId: string): TenantKind | undefined {
  return DEMO_TENANTS_DATA.find((t) => t.id === tenantId)?.kind;
}

/**
 * Returns true if the user should see the operator god-view.
 * Primary check: role_key from JWT auth context.
 * Fallback (demo mode, no auth): tenant kind from fixture data.
 */
export function isMonetizacionOperadorView(roleKey: string | null | undefined, tenantId?: string): boolean {
  if (roleKey) return OPERADOR_ROLE_KEYS.has(roleKey);
  // Demo fallback: no auth context available
  if (tenantId) return getMonetizacionTenantKind(tenantId) === "operador";
  return false;
}
