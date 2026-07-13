import { COCKPIT_CONSOLIDATION_FLAGS } from "@/lib/cockpit/finance-v3/flags";

export const isCockpitConsolidationEnabled = (): boolean =>
  COCKPIT_CONSOLIDATION_FLAGS.COCKPIT_CONSOLIDATION_ENABLED;

export function adminUserEditUrl(tenantId: string, userId: string): string {
  const q = new URLSearchParams({ tenant: tenantId, user: userId });
  return `/admin/users?${q.toString()}`;
}

export function adminTenantConfigUrl(tenantId: string): string {
  return `/admin/tenants/${encodeURIComponent(tenantId)}`;
}

export const ADMIN_TENANT_CREATE_URL = "/admin/tenants/new";
