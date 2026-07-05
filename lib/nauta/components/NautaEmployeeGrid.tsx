"use client";

import type { NautaEmployee } from "@/lib/nauta/types";
import { NautaEmptyState } from "./NautaEmptyState";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-950/40 text-emerald-400 border-emerald-800/40",
  idle: "bg-amber-950/40 text-amber-400 border-amber-800/40",
  paused: "bg-zinc-800/40 text-zinc-400 border-zinc-700/40",
  offline: "bg-zinc-800/40 text-zinc-500 border-zinc-700/40",
};

export function NautaEmployeeGrid({
  employees,
  loading,
  error,
  onRetry,
}: {
  employees: NautaEmployee[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <NautaEmptyState
        variant="error"
        title="No se pudieron cargar los empleados"
        description="Verifica tu conexión o reintenta en unos segundos."
        onRetry={onRetry}
      />
    );
  }

  if (employees.length === 0) {
    return (
      <NautaEmptyState
        title="Sin empleados digitales configurados"
        description="Cuando el backend Nauta registre roles E0/E1/E9 para tu institución, aparecerán aquí."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {employees.map((emp) => (
        <div
          key={emp.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 hover:border-violet-800/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="font-mono text-xs text-violet-400">{emp.role_id}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                STATUS_STYLE[emp.status] ?? STATUS_STYLE.offline
              }`}
            >
              {emp.status}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-100">{emp.role_name}</p>
          <p className="mt-1 text-xs text-zinc-500">{emp.department_id.replace(/-/g, " ")}</p>
        </div>
      ))}
    </div>
  );
}
