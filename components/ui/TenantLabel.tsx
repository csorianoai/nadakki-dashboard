"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nombre visible del tenant; nunca el UUID (el id queda solo en title). */
export function TenantLabel({ prefix = "", className }: { prefix?: string; className?: string }) {
  const { tenantName } = useAuth();
  const { tenantId } = useTenant();
  const name = tenantName?.trim();
  const shown = name && !UUID_RE.test(name) ? name : "—";
  return (
    <span className={className} title={tenantId ?? undefined} data-id={tenantId ?? undefined}>
      {prefix}
      {shown}
    </span>
  );
}
