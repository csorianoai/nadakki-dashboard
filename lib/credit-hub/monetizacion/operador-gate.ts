/**
 * Admin-only gate for monetización god-view screens (P1, P2, P3).
 *
 * Producción migrará a detección por rol JWT (platform_superadmin) cuando USE_API=true;
 * el tenant operador es el mecanismo demo mock-first.
 */
import { DEMO_TENANTS_DATA } from "./fixtures";
import type { TenantKind } from "./types";

export const MONETIZACION_OPERADOR_EMPTY_MESSAGE =
  "Vista de operador · solo Nadakki ve datos cross-tenant. Cambia el tenant switcher a Nadakki Operador.";

export function getMonetizacionTenantKind(tenantId: string): TenantKind | undefined {
  return DEMO_TENANTS_DATA.find((t) => t.id === tenantId)?.kind;
}

export function isMonetizacionOperadorView(tenantId: string): boolean {
  return getMonetizacionTenantKind(tenantId) === "operador";
}
