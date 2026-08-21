"use client";

import { useAuth } from "@/hooks/useAuth";
import { resolveAutosAdminAccess } from "@/lib/autos-portal/admin-rbac";

export function AutosAdminGate({ children }: { children: React.ReactNode }) {
  const { allRoles, isLoading } = useAuth();
  const access = resolveAutosAdminAccess(allRoles.map((r) => r.role_key));

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500" aria-busy="true">
        Verificando permisos…
      </div>
    );
  }

  if (!access.isPlatformAdmin && !access.isTenantAdmin) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-900">Acceso denegado</p>
          <p className="mt-2 text-sm text-red-800">
            Requiere rol <code className="font-mono">platform_admin</code> o{" "}
            <code className="font-mono">tenant_admin</code>.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function useAutosAdminAccess() {
  const { allRoles } = useAuth();
  return resolveAutosAdminAccess(allRoles.map((r) => r.role_key));
}
