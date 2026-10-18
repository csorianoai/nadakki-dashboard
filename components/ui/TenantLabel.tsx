"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Replacer de JSON.stringify para volcados visibles: un UUID se pinta «—» (PS-8). */
export const hideUuids = (_k: string, v: unknown) => (typeof v === "string" && UUID_RE.test(v) ? "—" : v);

/**
 * Nombre visible del tenant; nunca el UUID (el id queda solo en title/data-id).
 * `id` es el tenant sobre el que opera la pantalla (por defecto el del TenantContext).
 * El nombre de la sesión solo se muestra si ese id coincide con el de la sesión;
 * si divergen (o no hay id) se muestra «—» para no nombrar un tenant equivocado.
 */
export function TenantLabel({ prefix = "", className, id }: { prefix?: string; className?: string; id?: string | null }) {
  const { tenantName, tenantId: authTenantId } = useAuth();
  const { tenantId: ctxTenantId } = useTenant();
  const target = id === undefined ? ctxTenantId : id;
  const name = tenantName?.trim();
  const same = !!target && target === authTenantId;
  const shown = same && name && !UUID_RE.test(name) ? name : "—";
  return (
    <span className={className} title={target ?? undefined} data-id={target ?? undefined}>
      {prefix}
      {shown}
    </span>
  );
}
