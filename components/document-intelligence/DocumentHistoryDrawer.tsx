"use client";

import { useEffect, useState } from "react";
import { History, X, Loader2 } from "lucide-react";
import { CreditApiError } from "@/lib/credit-api";
import {
  getDocumentHistory,
  type DocumentHistoryEntry,
} from "@/lib/api/document-intelligence";

export interface DocumentHistoryDrawerProps {
  tenantId: string;
  applicationId: string;
  refreshSignal?: number;
}

function statusLabel(s: DocumentHistoryEntry["status"]): string {
  switch (s) {
    case "active":
      return "Activo";
    case "replaced":
      return "Reemplazado";
    case "deleted":
      return "Eliminado";
    default:
      return s;
  }
}

function statusBadgeClass(s: DocumentHistoryEntry["status"]): string {
  switch (s) {
    case "active":
      return "bg-emerald-500/20 text-emerald-200 border-emerald-500/30";
    case "replaced":
      return "bg-amber-500/20 text-amber-100 border-amber-500/30";
    case "deleted":
      return "bg-slate-600/30 text-slate-300 border-slate-500/30";
    default:
      return "bg-white/10 text-slate-300";
  }
}

export default function DocumentHistoryDrawer({
  tenantId,
  applicationId,
  refreshSignal = 0,
}: DocumentHistoryDrawerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<DocumentHistoryEntry[]>([]);

  useEffect(() => {
    if (!open || !tenantId.trim()) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await getDocumentHistory(applicationId, tenantId);
        if (!cancelled) setVersions(r.versions);
      } catch (e) {
        if (!cancelled) {
          setVersions([]);
          setError(
            e instanceof CreditApiError
              ? e.message
              : "No se pudo cargar el historial."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tenantId, applicationId, refreshSignal]);

  const sorted = [...versions].sort((a, b) => a.version - b.version);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
      >
        <History className="w-3.5 h-3.5" />
        Historial de versiones
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          />
          <aside className="relative w-full max-w-md h-full bg-slate-950 border-l border-white/10 shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white m-0">
                Versiones (v1, v2, v3…)
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando historial…
                </div>
              ) : error ? (
                <p className="text-sm text-amber-200 m-0">{error}</p>
              ) : sorted.length === 0 ? (
                <p className="text-sm text-slate-500 m-0">
                  Sin versiones registradas. Tras subidas o reemplazos, aparecerán
                  aquí como v1, v2, v3 con estado activo / reemplazado / eliminado.
                </p>
              ) : (
                <ul className="space-y-3 m-0 p-0 list-none">
                  {sorted.map((v) => (
                    <li
                      key={`${v.document_id}-${v.version}`}
                      className="rounded-lg border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-300">
                          v{v.version}
                        </span>
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded border ${statusBadgeClass(v.status)}`}
                        >
                          {statusLabel(v.status)}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 m-0 break-all">
                        {v.document_id}
                      </p>
                      {v.label ? (
                        <p className="text-xs text-slate-400 m-0 mt-1">{v.label}</p>
                      ) : null}
                      {v.created_at ? (
                        <p className="text-[10px] text-slate-600 m-0 mt-1">
                          {v.created_at}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
