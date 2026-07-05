"use client";

import Link from "next/link";
import type { NautaRunSummary } from "@/lib/nauta/types";
import { NautaEmptyState } from "./NautaEmptyState";

const RISK: Record<string, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-DO", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function NautaRunsTable({
  runs,
  loading,
  error,
  onRetry,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
}: {
  runs: NautaRunSummary[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="h-10 bg-zinc-900 animate-pulse border-b border-zinc-800" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 border-b border-zinc-800/50 bg-zinc-950/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <NautaEmptyState
        variant="error"
        title="No se pudieron cargar las ejecuciones"
        description="Verifica sesión JWT y módulo Nauta para tu tenant."
        onRetry={onRetry}
      />
    );
  }

  if (runs.length === 0) {
    return (
      <NautaEmptyState
        title="Sin ejecuciones recientes"
        description="Usa el selector de plantilla arriba para crear tu primera ejecución simulate."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-zinc-800 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">Tarea</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Riesgo</th>
              <th className="px-4 py-3 font-medium text-right">Horas</th>
              <th className="px-4 py-3 font-medium text-right">Hallazgos</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40">
                <td className="px-4 py-3">
                  <Link href={`/nauta/runs/${run.id}`} className="font-medium text-violet-400 hover:text-violet-300">
                    {run.task_name}
                  </Link>
                  <div className="text-[11px] text-zinc-600 font-mono mt-0.5">{run.id}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{run.role_name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs text-zinc-300">{run.status}</span>
                  {run.success ? (
                    <span className="ml-1 text-[10px] text-emerald-500">OK</span>
                  ) : (
                    <span className="ml-1 text-[10px] text-zinc-600">—</span>
                  )}
                </td>
                <td className={`px-4 py-3 text-xs font-medium ${RISK[run.risk_level] ?? "text-zinc-400"}`}>
                  {run.risk_level}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                  {run.hours_saved_estimate.toFixed(1)}h
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{run.findings_count}</td>
                <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{fmtDate(run.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPageChange && totalPages > 1 ? (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded border border-zinc-700 px-2 py-1 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded border border-zinc-700 px-2 py-1 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
