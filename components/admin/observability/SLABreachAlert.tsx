"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { SlaBreach } from "@/lib/admin/observability-types";

function formatTs(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export interface SLABreachAlertProps {
  breaches: SlaBreach[];
  className?: string;
}

export function SLABreachAlert({ breaches, className = "" }: SLABreachAlertProps) {
  if (!breaches.length) {
    return (
      <div
        className={`flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 ${className}`}
        role="status"
      >
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
        <div>
          <p className="m-0 font-medium text-emerald-50">SLA dentro de objetivo</p>
          <p className="mt-1 mb-0 text-xs text-emerald-200/90">No hay incumplimientos activos en la ventana actual.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`} role="alert">
      {breaches.map((b) => (
        <div
          key={b.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            b.severity === "critical"
              ? "border-rose-500/35 bg-rose-500/15 text-rose-50"
              : "border-amber-400/30 bg-amber-400/10 text-amber-50"
          }`}
        >
          <AlertTriangle
            className={`mt-0.5 h-5 w-5 shrink-0 ${b.severity === "critical" ? "text-rose-300" : "text-amber-300"}`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="m-0 font-semibold">{b.name}</p>
            {b.message ? <p className="mt-1 mb-0 text-xs opacity-90">{b.message}</p> : null}
            <dl className="mt-2 mb-0 grid grid-cols-2 gap-x-4 gap-y-1 text-xs opacity-80 sm:grid-cols-4">
              {b.target_ms != null ? (
                <>
                  <dt className="text-white/60">Objetivo</dt>
                  <dd className="m-0 font-mono">{b.target_ms} ms</dd>
                </>
              ) : null}
              {b.actual_ms != null ? (
                <>
                  <dt className="text-white/60">Actual</dt>
                  <dd className="m-0 font-mono">{b.actual_ms} ms</dd>
                </>
              ) : null}
              <dt className="text-white/60">Desde</dt>
              <dd className="col-span-1 m-0 sm:col-span-1">{formatTs(b.since)}</dd>
            </dl>
          </div>
        </div>
      ))}
    </div>
  );
}
