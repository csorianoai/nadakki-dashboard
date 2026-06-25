"use client";

import type { LegalKPI } from "@/lib/legal-cockpit/types";

const SEVERITY: Record<string, string> = {
  neutral: "text-zinc-200",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
};

export function LegalKPIRow({
  kpis,
  loading,
}: {
  kpis: LegalKPI[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.key}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative"
        >
          {kpi.demoData && (
            <span className="absolute top-2 right-2 text-[9px] text-zinc-600">
              demo
            </span>
          )}
          <p className="text-[11px] text-zinc-500 mb-1">{kpi.label}</p>
          <p className={`text-2xl font-medium ${SEVERITY[kpi.severity]}`}>
            {kpi.value}
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5">{kpi.helper}</p>
        </div>
      ))}
    </div>
  );
}
