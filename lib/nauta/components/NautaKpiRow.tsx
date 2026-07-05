"use client";

import { useMemo } from "react";
import type { NautaEmployee, NautaRunSummary } from "@/lib/nauta/types";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function NautaKpiRow({
  employees,
  runs,
  loading,
}: {
  employees: NautaEmployee[];
  runs: NautaRunSummary[];
  loading?: boolean;
}) {
  const metrics = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === "active").length;
    const runsToday = runs.filter((r) => isToday(r.created_at)).length;
    const hoursSaved = runs.reduce((sum, r) => sum + (r.hours_saved_estimate ?? 0), 0);
    const findings = runs.reduce((sum, r) => sum + (r.findings_count ?? 0), 0);
    return { activeEmployees, runsToday, hoursSaved, findings };
  }, [employees, runs]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Empleados activos",
      value: metrics.activeEmployees,
      sub: `${employees.length} configurados`,
      accent: "139,92,246",
    },
    {
      label: "Runs hoy",
      value: metrics.runsToday,
      sub: `${runs.length} en ventana reciente`,
      accent: "16,185,129",
    },
    {
      label: "Horas ahorradas",
      value: metrics.hoursSaved.toFixed(1),
      sub: "suma hours_saved_estimate",
      accent: "59,130,246",
    },
    {
      label: "Hallazgos",
      value: metrics.findings,
      sub: "suma findings_count",
      accent: "244,63,94",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{c.value}</p>
          <p className="mt-1 text-xs text-zinc-600">{c.sub}</p>
          <div
            className="pointer-events-none absolute -right-4 -bottom-4 h-16 w-16 rounded-full opacity-20 blur-2xl"
            style={{ background: `rgb(${c.accent})` }}
          />
        </div>
      ))}
    </div>
  );
}
