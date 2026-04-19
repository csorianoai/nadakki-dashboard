"use client";
import React, { useMemo } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  Clock,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useSystemHealth, { SystemStatus, SystemCheck } from "./useSystemHealth";

type StatusPalette = { bg: string; text: string; ring: string; label: string };

function paletteFor(score: number | null, status: SystemStatus): StatusPalette {
  if (score == null) {
    return { bg: "bg-slate-500/10", text: "text-slate-300", ring: "ring-slate-500/40", label: "Desconocido" };
  }
  if (score >= 85) {
    return { bg: "bg-emerald-500/10", text: "text-emerald-300", ring: "ring-emerald-500/40", label: "Saludable" };
  }
  if (score >= 70) {
    return { bg: "bg-amber-500/10", text: "text-amber-300", ring: "ring-amber-500/40", label: "Advertencia" };
  }
  return { bg: "bg-rose-500/10", text: "text-rose-300", ring: "ring-rose-500/40", label: "Crítico" };
}

function relativeMinutes(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60_000));
  if (mins < 1) return "hace segundos";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

function nextRunInText(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `en ${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `en ~${mins} min`;
  return `en ~${Math.floor(mins / 60)} h`;
}

function checkIcon(status: string) {
  const s = status.toLowerCase();
  if (s === "pass" || s === "ok" || s === "healthy") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (s === "warn" || s === "warning" || s === "degraded") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  if (s === "fail" || s === "error" || s === "critical") return <XCircle className="w-4 h-4 text-rose-400" />;
  return <Activity className="w-4 h-4 text-slate-400" />;
}

function sortChecks(checks: SystemCheck[]): SystemCheck[] {
  const order: Record<string, number> = { fail: 0, error: 0, critical: 0, warn: 1, warning: 1, pass: 2, ok: 2 };
  return [...checks].sort((a, b) => (order[(a.status || "").toLowerCase()] ?? 3) - (order[(b.status || "").toLowerCase()] ?? 3));
}

export interface AutonomousHealthPanelProps {
  className?: string;
  pollMs?: number;
}

export default function AutonomousHealthPanel({
  className = "",
  pollMs = 60_000,
}: AutonomousHealthPanelProps) {
  const {
    currentScore,
    currentStatus,
    lastRunAt,
    schedulerActive,
    nextRunInSeconds,
    trend,
    recentActions,
    checks,
    isLoading,
    isTriggering,
    error,
    triggerManualRun,
  } = useSystemHealth(pollMs);

  const palette = paletteFor(currentScore, currentStatus);

  const trendData = useMemo(() => {
    return (trend || []).map((b) => ({
      t: b.bucket_hour,
      score: Math.round(b.avg_score ?? 0),
      count: b.run_count,
    }));
  }, [trend]);

  const sortedChecks = useMemo(() => sortChecks(checks), [checks]);

  const onRunNow = async () => {
    await triggerManualRun({ dryRun: true });
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" /> System Health
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">
              {currentScore ?? "—"}
              <span className="text-base text-slate-500">/100</span>
            </span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${palette.bg} ${palette.text} ${palette.ring}`}>
              {palette.label}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Último: {relativeMinutes(lastRunAt)}</span>
            <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3" /> Scheduler: {schedulerActive ? "activo" : "detenido"}</span>
            <span>Próximo: {nextRunInText(nextRunInSeconds)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRunNow}
          disabled={isTriggering}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTriggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isTriggering ? "Ejecutando…" : "Run Now"}
        </button>
      </div>

      {/* Trend */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Tendencia (7 días)</div>
        <div className="h-20">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(value: number | string) => [`${value}`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-600">
              Sin datos de tendencia todavía
            </div>
          )}
        </div>
      </div>

      {/* Recent actions */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Acciones recientes</div>
        {recentActions && recentActions.length > 0 ? (
          <ul className="space-y-1.5">
            {recentActions.slice(0, 5).map((a, i) => {
              const id = (a.action_id as string) || "action";
              const status = (a.status as string) || "ok";
              const good = status === "sent" || status === "executed" || status === "ok";
              return (
                <li key={i} className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    {good ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : status === "skipped" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className="font-mono">{id}</span>
                  </span>
                  <span className="text-slate-500">{status}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-xs text-slate-600">Sin acciones recientes</div>
        )}
      </div>

      {/* Checks */}
      <div className="px-5 py-4">
        <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">
          Detalles de chequeos {sortedChecks.length > 0 ? `(${sortedChecks.length})` : ""}
        </div>
        {sortedChecks.length > 0 ? (
          <ul className="divide-y divide-white/5">
            {sortedChecks.map((c, i) => (
              <li key={`${c.name}-${i}`} className="flex items-center justify-between py-1.5 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-300">
                  {checkIcon(String(c.status || ""))}
                  <span className="font-mono text-xs">{c.name}</span>
                </span>
                <span className="text-xs text-slate-500 uppercase">{String(c.status || "")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-slate-600">
            {isLoading ? "Cargando chequeos…" : "Sin chequeos todavía. Pulsa Run Now para iniciar."}
          </div>
        )}
      </div>

      {error ? (
        <div className="px-5 py-2 text-[11px] text-rose-400 border-t border-rose-500/20 bg-rose-500/5">
          {error}
        </div>
      ) : null}
    </div>
  );
}
