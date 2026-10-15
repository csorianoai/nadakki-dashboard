"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useTenant as useDashboardTenant } from "@/contexts/TenantContext";
import { ForgeButton } from "../primitives/ForgeButton";

interface CHTenantGuardProps {
  children: ReactNode;
}

export function CHTenantGuard({ children }: CHTenantGuardProps) {
  const { apiTenantId, loading } = useTenant();
  const { isAuthenticated, isLoading: sessionLoading, tenant, allTenants, switchTenant } = useAuth();
  const { setTenantId } = useDashboardTenant();
  const [selecting, setSelecting] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // An authenticated session can still need an organization selection.
    // Sending it back to login creates a loop and never resolves that selection.
    if (loading || sessionLoading || isAuthenticated) return;
    const next = pathname && pathname !== "/" ? pathname : "/credit-hub";
    const target = `/login?next=${encodeURIComponent(next)}`;
    if (!pathname?.startsWith("/login")) {
      router.replace(target);
    }
  }, [apiTenantId, loading, sessionLoading, isAuthenticated, pathname, router]);

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-forge-bg">
        <div className="animate-pulse text-forge-text-muted">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated || !apiTenantId || apiTenantId !== tenant?.id) {
    const choices = [...new Map([...(allTenants ?? []), ...(tenant ? [tenant] : [])].map((item) => [item.id, item])).values()];
    const selectTenant = async (id: string) => {
      if (selecting || !isAuthenticated || !choices.some((item) => item.id === id)) return;
      setSelecting(true);
      setSelectionError(null);
      try {
        const result = await switchTenant(id);
        if (!result.ok) {
          setSelectionError("No se pudo seleccionar la organización. Verifica tu acceso e intenta de nuevo.");
          return;
        }
        // Only synchronize the legacy context after server authorization succeeds.
        setTenantId(id);
      } catch {
        setSelectionError("No se pudo seleccionar la organización. Intenta de nuevo.");
      } finally {
        setSelecting(false);
      }
    };
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-forge-bg p-4"
        data-testid="ch-tenant-guard-blocked"
      >
        <div className="max-w-md text-center">
          <Building2 className="mx-auto mb-4 h-16 w-16 text-forge-text-muted" />
          <h2 className="mb-2 font-display text-2xl font-bold text-forge-text">Selecciona tu organización</h2>
          <p className="mb-6 text-forge-text-muted">
            Para acceder a Credit Hub, necesitas seleccionar la organización con la que vas a trabajar.
          </p>
          {isAuthenticated && apiTenantId && apiTenantId !== tenant?.id ? (
            <p role="alert">Acceso denegado: la organización seleccionada no coincide con tu sesión.</p>
          ) : null}
          {isAuthenticated ? choices.map((item) => (
            <ForgeButton key={item.id} variant="primary" size="lg" disabled={selecting} onClick={() => void selectTenant(item.id)}>
              Seleccionar {item.display_name}
            </ForgeButton>
          )) : null}
          {isAuthenticated && choices.length === 0 ? (
            <p>No hay organizaciones disponibles en tu sesión. Solicita acceso al administrador.</p>
          ) : null}
          {selectionError ? <p role="alert">{selectionError}</p> : null}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
