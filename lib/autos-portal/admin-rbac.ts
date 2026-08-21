/** RBAC helpers for Autos admin surfaces. */

export type AutosAdminAccess = {
  isPlatformAdmin: boolean;
  isTenantAdmin: boolean;
  canModerateVehicles: boolean;
  canVerifyDealers: boolean;
  canManageFlags: boolean;
  canViewCommissions: boolean;
};

export function resolveAutosAdminAccess(roleKeys: string[]): AutosAdminAccess {
  const isPlatformAdmin = roleKeys.some((r) =>
    ["platform_superadmin", "platform_admin"].includes(r),
  );
  const isTenantAdmin = roleKeys.includes("tenant_admin");
  return {
    isPlatformAdmin,
    isTenantAdmin,
    canModerateVehicles: isPlatformAdmin,
    canVerifyDealers: isPlatformAdmin,
    canManageFlags: isPlatformAdmin || isTenantAdmin,
    canViewCommissions: isPlatformAdmin || isTenantAdmin,
  };
}
