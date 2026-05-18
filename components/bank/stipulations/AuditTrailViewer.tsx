"use client";

import { useEffect, useState } from "react";
import type { StipulationAuditEntry, StipulationsApiRole } from "@/lib/api/stipulations-types";
import { getStipulationAudit } from "@/lib/api/stipulations";
import { maskAuditDetail } from "@/lib/bank/stipulations/pii";

export interface AuditTrailViewerProps {
  applicationId: string;
  stipulationId: string;
  role: StipulationsApiRole;
  className?: string;
}

export function AuditTrailViewer({ applicationId, stipulationId, role, className = "" }: AuditTrailViewerProps) {
  const [entries, setEntries] = useState<StipulationAuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const rows = await getStipulationAudit(applicationId, stipulationId, role);
        if (!cancelled) setEntries(rows);
      } catch {
        if (!cancelled) {
          setEntries([]);
          setError("No se pudo cargar la auditoría.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId, stipulationId, role]);

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`} data-testid="audit-trail-skeleton" aria-busy="true">
        <div className="h-3 w-full animate-pulse rounded bg-forgeGray-100" />
        <div className="h-3 w-[80%] animate-pulse rounded bg-forgeGray-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-forgeGray-100" />
      </div>
    );
  }

  if (error) {
    return <p className={`text-forge-sm text-amber-700 ${className}`}>{error}</p>;
  }

  if (!entries?.length) {
    return <p className={`text-forge-sm text-forgeGray-500 ${className}`}>Sin eventos de auditoría.</p>;
  }

  return (
    <ol className={`relative m-0 list-none space-y-4 border-l-2 border-forgeGray-100 pl-4 ${className}`}>
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[9px] top-1.5 h-3 w-3 rounded-full bg-forgeBrand-400 ring-2 ring-white" />
          <p className="m-0 text-forge-xs text-forgeGray-500">
            {new Date(e.at).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" })}
            {e.actor ? ` · ${e.actor}` : ""}
          </p>
          <p className="mt-0.5 m-0 text-forge-sm font-medium text-forgeGray-900">{e.action}</p>
          {e.detail ? (
            <p className="mt-1 m-0 font-forgeMono text-[11px] text-forgeGray-700">{maskAuditDetail(e.detail, role)}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
