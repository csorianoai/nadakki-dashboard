"use client";

import { Activity, Globe2, ServerCrash } from "lucide-react";
import type { TenantHealthSnapshot } from "@/lib/admin/observability-types";

function statusPill(status: TenantHealthSnapshot["status"]): { label: string; cls: string } {
  if (status === "healthy") return { label: "Saludable", cls: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30" };
  if (status === "degraded")
    return { label: "Degradado", cls: "bg-amber-500/20 text-amber-100 border-amber-400/35" };
  return { label: "Crítico", cls: "bg-rose-500/25 text-rose-100 border-rose-500/35" };
}

function formatTs(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export interface TenantHealthCardProps {
  health: TenantHealthSnapshot;
  className?: string;
}

export function TenantHealthCard({ health, className = "" }: TenantHealthCardProps) {
  const pill = statusPill(health.status);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-6 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-lg font-semibold text-white">Salud del tenant</h2>
          {health.notes ? (
            <p className="mt-1 max-w-xl text-sm text-gray-400">{health.notes}</p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">Resumen operativo para administradores.</p>
          )}
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${pill.cls}`}
        >
          {pill.label}
        </span>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <Activity className="h-5 w-5 shrink-0 text-cyan-400" aria-hidden />
          <div>
            <dt className="text-xs text-gray-500">Uptime</dt>
            <dd className="m-0 text-lg font-semibold text-white">
              {health.uptime_pct != null ? `${health.uptime_pct.toFixed(2)}%` : "—"}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <ServerCrash className="h-5 w-5 shrink-0 text-rose-400" aria-hidden />
          <div>
            <dt className="text-xs text-gray-500">Incidentes abiertos</dt>
            <dd className="m-0 text-lg font-semibold text-white">{health.open_incidents ?? "—"}</dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <Globe2 className="h-5 w-5 shrink-0 text-violet-400" aria-hidden />
          <div>
            <dt className="text-xs text-gray-500">Región</dt>
            <dd className="m-0 text-lg font-semibold text-white">{health.region ?? "—"}</dd>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <dt className="text-xs text-gray-500">Último deploy</dt>
          <dd className="m-0 text-sm font-medium text-gray-200">{formatTs(health.last_deploy_at)}</dd>
        </div>
      </dl>
    </div>
  );
}
