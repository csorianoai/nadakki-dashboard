"use client";

import { useState } from "react";
import type { BankAnalytics } from "@/types/bank-analytics";
import { maskBankAnalyticsText } from "@/lib/bank/analytics-api";

export function AnomaliesSkeleton() {
  return (
    <div
      className="space-y-2 rounded-xl border border-white/10 p-4"
      data-testid="anomalies-panel-skeleton"
      aria-busy="true"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />
      ))}
    </div>
  );
}

function severityTone(severity: BankAnalytics["anomalies"][number]["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-rose-500/60 bg-rose-950/55 text-rose-100";
    case "high":
      return "border-orange-400/55 bg-orange-950/55 text-orange-100";
    case "medium":
      return "border-amber-300/55 bg-amber-950/50 text-amber-50";
    default:
      return "border-slate-500/50 bg-slate-900/50 text-slate-100";
  }
}

interface AnomaliesPanelProps {
  items: BankAnalytics["anomalies"];
  loading: boolean;
}

export function AnomaliesPanel({ items, loading }: AnomaliesPanelProps) {
  const [focused, setFocused] = useState<string | null>(null);

  if (loading) {
    return <AnomaliesSkeleton />;
  }

  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-gray-400" data-testid="anomalies-empty">
        No hay incidentes destacados durante el umbral solicitado (datos sólo sintéticos/agregados).
      </p>
    );
  }

  return (
    <section aria-label="Anomalías sintéticas supervisadas por riesgos" data-testid="anomalies-panel">
      <header className="mb-4 flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-white">Anomalías en tiempo cercano · real</h3>
        <p className="text-xs text-gray-500">
          Resúmenes ofuscados antes de llegar al navegador; detalle clic expande contenido igualmente sanitizado.
        </p>
      </header>

      <ul className="space-y-3" role="list">
        {items.map((item) => {
          const maskedType = maskBankAnalyticsText(item.type);
          const maskedDescription = maskBankAnalyticsText(item.description);
          const open = focused === item.id;
          const ts = Date.parse(item.detectedAt || "");
          const label = Number.isFinite(ts)
            ? new Date(ts).toLocaleString("es-DO")
            : item.detectedAt;

          return (
            <li key={item.id} className="rounded-2xl border border-white/8 bg-black/35 p-3 shadow-inner">
              <button
                type="button"
                aria-expanded={open}
                className={`flex w-full flex-col gap-2 rounded-xl border px-3 py-2 text-left outline-none ring-fuchsia-500/40 transition focus-visible:ring-2 md:flex-row md:items-center md:justify-between ${severityTone(item.severity)}`}
                data-testid={`anomaly-${item.id}`}
                onClick={() => setFocused(open ? null : item.id)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-2 inline-flex rounded-full border border-current px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
                    {item.severity}
                  </span>
                  <span className="text-sm font-medium text-white">
                    #{item.id.slice(0, 8)}
                  </span>
                  <span className="rounded-md bg-black/35 px-2 py-1 text-[11px] text-gray-300">{maskedType}</span>
                </div>
                <span className="font-mono text-[11px] text-gray-400">{label}</span>
              </button>
              <div className={`mt-2 text-sm leading-relaxed ${open ? "" : "line-clamp-2"}`}>{maskedDescription}</div>
              <p className="sr-only" aria-live="polite">
                {focused === item.id
                  ? "Detalle de anomalía desplegado con campos sanitizados adicionales"
                  : "Resumen contraído"}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
