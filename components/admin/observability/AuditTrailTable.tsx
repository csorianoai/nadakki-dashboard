"use client";

import { useMemo, useState } from "react";
import type { AuditTrailRow } from "@/lib/admin/observability-types";

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "medium" });
}

function toneForStatus(status?: string): string {
  const s = (status ?? "").trim();
  if (/^5\d\d$/.test(s) || /fail|error/i.test(s)) return "text-rose-300";
  if (/^4\d\d$/.test(s)) return "text-amber-300";
  if (/^2\d\d$/.test(s) || /ok|success/i.test(s)) return "text-emerald-300";
  return "text-slate-300";
}

export interface AuditTrailTableProps {
  rows: AuditTrailRow[];
  className?: string;
  pageSize?: number;
}

export function AuditTrailTable({ rows, className = "", pageSize = 8 }: AuditTrailTableProps) {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [r.actor, r.action, r.resource, r.status, r.trace_id].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, filter]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  if (!rows.length) {
    return (
      <p
        className={`rounded-xl border border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-gray-500 ${className}`}
      >
        No hay eventos de auditoría en el intervalo.
      </p>
    );
  }

  return (
    <div className={className} data-testid="audit-trail-table">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-xs text-gray-500">
          Filtrar
          <input
            type="search"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
            placeholder="actor, acción, recurso…"
            className="ml-2 mt-1 w-full max-w-md rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-600 sm:mt-0"
            data-testid="audit-trail-filter"
          />
        </label>
        <p className="text-xs text-gray-500">
          {filtered.length} evento{filtered.length === 1 ? "" : "s"} · página {safePage + 1}/{pages}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm text-gray-200">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Hora
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Actor
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Acción
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Recurso
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Estado
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Trace
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {slice.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-gray-400">{formatTs(r.ts)}</td>
                <td className="px-4 py-2.5 text-gray-300">{r.actor ?? "—"}</td>
                <td className="px-4 py-2.5 font-medium text-white">{r.action}</td>
                <td className="max-w-[220px] truncate px-4 py-2.5 text-gray-400" title={r.resource}>
                  {r.resource ?? "—"}
                </td>
                <td className={`whitespace-nowrap px-4 py-2.5 font-mono text-xs ${toneForStatus(r.status)}`}>
                  {r.status ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-violet-300">
                  {r.trace_id ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 disabled:opacity-40"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            data-testid="audit-trail-prev"
          >
            Anterior
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 disabled:opacity-40"
            disabled={safePage >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            data-testid="audit-trail-next"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  );
}
