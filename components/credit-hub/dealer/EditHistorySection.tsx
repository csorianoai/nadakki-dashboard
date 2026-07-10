"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import { CHApiError } from "@/lib/credit-hub/api/client";
import { getEditHistory, isOperationalEndpointUnavailable } from "@/lib/credit-hub/api/operationalClient";
import { fieldLabel } from "@/lib/credit-hub/operational/application-edit";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

function formatValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "—";
  }
}

function formatWhen(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function EditHistorySection({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ["edit-history", apiTenantId, applicationId],
    queryFn: () => getEditHistory({ tenantId: apiTenantId!, applicationId, actorRole: "dealer" }),
    enabled: !!apiTenantId && open,
    retry: false,
  });

  if (q.error instanceof CHApiError && isOperationalEndpointUnavailable(q.error)) return null;

  const entries = q.data?.entries ?? [];

  return (
    <div className="ch-card mt-4 p-4" data-testid="edit-history-section">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left text-sm font-semibold"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <History className="h-4 w-4" aria-hidden />
        Historial de cambios
        {entries.length > 0 ? <span className="text-xs font-normal text-forgeGray-500">({entries.length})</span> : null}
      </button>
      {open ? (
        <div className="mt-3">
          {q.isLoading ? <p className="text-sm text-forgeGray-500">Cargando…</p> : null}
          {entries.length === 0 && !q.isLoading ? (
            <p className="text-sm text-forgeGray-500">Sin cambios registrados.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {entries.map((e, i) => (
                <li key={`${e.field}-${e.changed_at ?? i}`}>
                  <strong>{fieldLabel(e.field)}</strong> cambiado de <em>{formatValue(e.old_value)}</em> a{" "}
                  <em>{formatValue(e.new_value)}</em>
                  {e.changed_by ? ` por ${e.changed_by}` : ""}
                  {e.changed_at ? ` el ${formatWhen(e.changed_at)}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
