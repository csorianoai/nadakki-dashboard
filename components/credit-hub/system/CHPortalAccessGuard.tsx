"use client";

import { type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { roleKeyAllowsPortal, type CreditHubPortal } from "@/lib/credit-hub/auth/portal-access";

export interface CHPortalAccessGuardProps {
  portal: CreditHubPortal;
  children: ReactNode;
}

/** Blocks dealer/bank portal when active JWT role is not in the allow-list (403 UI). */
export function CHPortalAccessGuard({ portal, children }: CHPortalAccessGuardProps) {
  const { activeRole, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status">
        <span className="text-forge-text-muted">Verificando permisos…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6" data-testid="ch-portal-auth-required">
        <p className="text-sm text-forge-text-muted">Inicia sesión para acceder a este portal.</p>
      </div>
    );
  }

  const roleKey = activeRole?.role_key;
  if (!roleKeyAllowsPortal(roleKey, portal)) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center bg-forge-bg p-6"
        data-testid="ch-portal-forbidden"
        data-portal={portal}
        data-role={roleKey ?? "none"}
      >
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto mb-4 h-14 w-14 text-forge-danger" aria-hidden />
          <h2 className="mb-2 font-display text-xl font-bold text-forge-text">Acceso no autorizado</h2>
          <p className="text-sm text-forge-text-muted">
            Tu rol actual no tiene permiso para el portal {portal === "dealer" ? "concesionario" : "banco"}.
            Solicita el rol correcto al administrador del tenant.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
