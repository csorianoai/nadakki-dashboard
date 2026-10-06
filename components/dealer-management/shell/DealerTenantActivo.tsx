"use client";

import type { Context } from "react";
import { Building2 } from "lucide-react";
import type { AuthContextValue } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { useContextoSesionV2, useSesionDe } from "./useSesionV2";

/**
 * Indicador discreto del tenant ACTIVO de la sesion (auditoria Mapaal QA, P1).
 *
 * La marca de arriba sale del branding y cae a "Nadakki" mientras carga: no
 * dice en que cuenta se esta operando. Esto si: es el tenant de `/auth/me`, el
 * mismo con el que se firman las peticiones. Sin sesion no se pinta nada, en vez
 * de un nombre supuesto.
 */
export function DealerTenantActivo({ collapsed }: { collapsed: boolean }) {
  const ctx = useContextoSesionV2();
  if (!ctx) return null;
  return <Indicador ctx={ctx} collapsed={collapsed} />;
}

function Indicador({ ctx, collapsed }: { ctx: Context<AuthContextValue | null>; collapsed: boolean }) {
  const tenant = useSesionDe(ctx)?.tenant;
  const nombre = tenant?.display_name?.trim() || tenant?.slug?.trim();
  if (!nombre) return null;
  const detalle = tenant?.slug && tenant.slug !== nombre ? `${nombre} (${tenant.slug})` : nombre;
  return (
    <p
      data-testid="dealer-tenant-activo"
      title={`Cuenta activa: ${detalle}`}
      className={cn(
        "mb-2 flex min-h-8 items-center text-[11px] text-[var(--nav-fg-muted)]",
        collapsed ? "justify-center" : "gap-2 px-3",
      )}
    >
      <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className={collapsed ? "sr-only" : "truncate"}>
        <span className="sr-only">Cuenta activa: </span>
        {nombre}
      </span>
    </p>
  );
}
