"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Nombre visible del tenant; nunca el UUID (el id queda solo en title/data-id).
 * El nombre es el de la sesión: solo se muestra si el id operativo (prop `tenantId`
 * o el de TenantContext) coincide con el de la sesión; si divergen, «—».
 */
export function TenantLabel({
  prefix = "",
  className,
  tenantId: operatingId,
}: {
  prefix?: string;
  className?: string;
  tenantId?: string | null;
}) {
  const { tenantId: sessionId, tenantName } = useAuth();
  const { tenantId: ctxId } = useTenant();
  const id = operatingId !== undefined ? operatingId : ctxId;
  const name = tenantName?.trim();
  const matches = !!id && !!sessionId && id === sessionId;
  const shown = matches && name && !UUID_RE.test(name) ? name : "—";
  return (
    <span className={className} title={id ?? undefined} data-id={id ?? undefined}>
      {prefix}
      {shown}
    </span>
  );
}
