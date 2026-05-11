"use client";

import { useAuth } from "./useAuth";

const ROLE_PERMS: Record<string, Record<string, string[]>> = {
  credit: {
    tenant_admin: ["applications:*", "users:*", "settings:*"],
    credit_officer: ["applications:read", "applications:approve", "applications:reject"],
    dealer: ["applications:create", "applications:read", "vehicles:read"],
    compliance_officer: ["applications:read", "audit:read", "policies:read"],
    viewer: ["applications:read", "vehicles:read"],
  },
  legal: {
    tenant_admin: ["cases:*", "users:*"],
    lawyer: ["cases:*", "documents:*"],
    paralegal: ["cases:read", "cases:edit", "documents:read"],
    viewer: ["cases:read"],
  },
  marketing: {
    tenant_admin: ["campaigns:*", "users:*"],
    marketing_officer: ["campaigns:*", "leads:read"],
    viewer: ["campaigns:read"],
  },
  platform: {
    platform_superadmin: ["*:*"],
    support_agent: ["tickets:*"],
    tenant_admin: ["users:*"],
  },
};

export function useRBAC() {
  const { activeRole, allRoles, switchRole } = useAuth();

  const hasRole = (coreName: string, roleKey: string): boolean => {
    return allRoles.some((r) => r.core_name === coreName && r.role_key === roleKey);
  };

  const hasPermission = (coreName: string, resource: string, action: string): boolean => {
    if (!activeRole || activeRole.core_name !== coreName) return false;
    const perms = ROLE_PERMS[coreName]?.[activeRole.role_key] || [];
    return perms.some((p) => {
      const [r, a] = p.split(":");
      return (r === "*" || r === resource) && (a === "*" || a === action);
    });
  };

  return {
    activeRole,
    allRoles,
    hasRole,
    hasPermission,
    switchRole,
  };
}
