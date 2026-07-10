"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { roleKeyAllowsAdminNetwork } from "@/lib/credit-hub/auth/portal-access";

export interface CHAdminAccessGuardProps {
  children: ReactNode;
}

/**
 * Blocks /credit-hub/admin unless JWT role is platform_superadmin or tenant_admin.
 * Generic `admin` / portal roles (dealer, bank_analyst) are intentionally excluded.
 */
export function CHAdminAccessGuard({ children }: CHAdminAccessGuardProps) {
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
      <div className="flex min-h-[40vh] items-center justify-center p-6" data-testid="ch-admin-auth-required">
        <p className="text-sm text-forge-text-muted">Inicia sesión para acceder al panel de administración.</p>
      </div>
    );
  }

  const roleKey = activeRole?.role_key;
  if (!roleKeyAllowsAdminNetwork(roleKey)) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center bg-forge-bg p-6"
        data-testid="ch-admin-forbidden"
        data-role={roleKey ?? "none"}
      >
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto mb-4 h-14 w-14 text-forge-danger" aria-hidden />
          <h2 className="mb-2 font-display text-xl font-bold text-forge-text">Acceso no autorizado</h2>
          <p className="mb-4 text-sm text-forge-text-muted">
            El panel de administración de red requiere rol <strong>platform_superadmin</strong> o{" "}
            <strong>tenant_admin</strong>.
          </p>
          <Link href="/credit-hub" className="ch-btn ch-btn-secondary ch-btn-sm">
            Volver al hub
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
