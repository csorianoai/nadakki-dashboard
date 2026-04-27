"use client";

import { type ReactNode } from "react";
import { Building2 } from "lucide-react";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { ForgeButton } from "../primitives/ForgeButton";

interface CHTenantGuardProps {
  children: ReactNode;
}

export function CHTenantGuard({ children }: CHTenantGuardProps) {
  const { tenantId, loading } = useTenant();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-forge-bg">
        <div className="animate-pulse text-forge-text-muted">Cargando...</div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-forge-bg p-4">
        <div className="max-w-md text-center">
          <Building2 className="mx-auto mb-4 h-16 w-16 text-forge-text-muted" />
          <h2 className="mb-2 font-display text-2xl font-bold text-forge-text">Selecciona tu organización</h2>
          <p className="mb-6 text-forge-text-muted">
            Para acceder a Nadakki Forge, necesitas seleccionar el tenant con el que vas a trabajar.
          </p>
          <ForgeButton variant="primary" size="lg" onClick={() => (window.location.href = "/")}>
            Ir al selector
          </ForgeButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
