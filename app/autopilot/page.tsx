"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Zap,
  RefreshCw,
  Loader2,
  AlertCircle,
  Play,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchSchedulerStatus,
  formatBool,
  type SchedulerStatusPayload,
  type AmeAutopilotStatus,
} from "@/lib/scheduler-status";
import {
  fetchActiveCampaigns,
  fetchBestActions,
  triggerAutopilotCycle,
  type ActiveCampaignItem,
  type BestActionItem,
  type CycleTriggerResult,
} from "@/lib/api/autopilot";

// ——— Status helpers ———

function statusColor(status?: string): string {
  if (!status) return "text-slate-500";
  const s = status.toLowerCase();
  if (s === "completed" || s === "active" || s === "ok") return "text-emerald-400";
  if (s === "running" || s === "in_progress") return "text-cyan-400";
  if (s === "failed" || s === "error") return "text-red-400";
  if (s === "skipped" || s === "blocked") return "text-amber-400";
  return "text-slate-300";
}

function statusDot(active: boolean): string {
  return active
    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
    : "bg-slate-600";
}

function formatMs(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ——— Component ———

export default function AutopilotPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "default";

  // State
  const [scheduler, setScheduler] = useState<SchedulerStatusPayload | null>(null);
  const [campaigns, setCampaigns] = useState<ActiveCampaignItem[]>([]);
  const [bestActions, setBestActions] = useState<BestActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<CycleTriggerResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedRes, campRes, actionsRes] = await Promise.allSettled([
        fetchSchedulerStatus(),
        fetchActiveCampaigns(tenant),
        fetchBestActions(tenant),
      ]);

      if (schedRes.status === "fulfilled" && schedRes.value.ok) {
        setScheduler(schedRes.value.data);
      }
      if (campRes.status === "fulfilled" && campRes.value) {
        setCampaigns(campRes.value.campaigns ?? []);
      }
      if (actionsRes.status === "fulfilled" && actionsRes.value) {
        setBestActions(actionsRes.value.best_actions ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTriggerCycle = useCallback(async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const result = await triggerAutopilotCycle(tenant, true);
      setTriggerResult(result);
      // Refresh status after trigger
      setTimeout(() => load(), 2000);
    } catch (e) {
      setTriggerResult({ success: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setTriggering(false);
    }
  }, [tenant, load]);

  const ame: AmeAutopilotStatus | undefined = scheduler?.ame_autopilot;
  const isRunning = ame?.job_running === true;
  const isEnabled = scheduler?.enabled === true;

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30">
            <Zap className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Autopilot IA</h1>
            <p className="text-slate-400 text-sm">Centro de control — optimizacion autonoma de campanas</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <p className="font-medium">Error al cargar datos</p>
            <p className="mt-1 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {loading && !scheduler ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando estado del autopilot...</span>
        </div>
      ) : (
        <>
          {/* ── Status Overview ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatusCard
              label="Motor Autopilot"
              value={isEnabled ? "Habilitado" : "Deshabilitado"}
              icon={<Activity className="w-5 h-5" />}
              active={isEnabled}
            />
            <StatusCard
              label="Ciclo Actual"
              value={isRunning ? "En ejecucion" : "Inactivo"}
              icon={<Zap className="w-5 h-5" />}
              active={isRunning}
            />
            <StatusCard
              label="Modo"
              value={ame?.dry_run_mode ? "Dry Run" : "Produccion"}
              icon={<Clock className="w-5 h-5" />}
              active={!ame?.dry_run_mode}
              note={ame?.dry_run_mode ? "Simulacion activa" : undefined}
            />
            <StatusCard
              label="Campanas Activas"
              value={String(campaigns.length)}
              icon={<TrendingUp className="w-5 h-5" />}
              active={campaigns.length > 0}
            />
          </div>

          {/* ── Scheduler Detail + Manual Trigger ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Estado Operativo</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Detail label="Schedule" value={ame?.schedule ?? "—"} mono />
                <Detail label="Ultimo ciclo" value={formatDate(ame?.last_run_at)} />
                <Detail label="Jobs registrados" value={String(scheduler?.jobs_count ?? 0)} />
                <Detail label="Soporte multi-tenant" value={formatBool(scheduler?.tenant_support)} />
                {ame?.last_error && (
                  <div className="col-span-2">
                    <span className="text-slate-500 text-xs">Ultimo error</span>
                    <p className="text-red-400/90 text-xs mt-1 font-mono break-all">{ame.last_error}</p>
                  </div>
                )}
                {ame?.next_timeslices && ame.next_timeslices.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-slate-500 text-xs">Proximos ciclos</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {ame.next_timeslices.slice(0, 4).map((ts, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono">
                          {formatDate(ts)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 flex flex-col">
              <h2 className="text-sm font-semibold text-violet-300 uppercase tracking-wide mb-3">Accion Manual</h2>
              <p className="text-xs text-slate-400 mb-4 flex-1">
                Dispara un ciclo autopilot en modo dry-run para evaluar optimizaciones sin ejecutar cambios reales.
              </p>
              <button
                type="button"
                onClick={handleTriggerCycle}
                disabled={triggering || isRunning}
                className="w-full rounded-xl py-3 px-4 font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
              >
                {triggering ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Ejecutando ciclo...</>
                ) : isRunning ? (
                  <><Clock className="w-4 h-4" /> Ciclo en curso</>
                ) : (
                  <><Play className="w-4 h-4" /> Ejecutar Ciclo Dry-Run</>
                )}
              </button>
              {triggerResult && (
                <div className={`mt-3 p-3 rounded-lg text-xs ${triggerResult.error || triggerResult.success === false ? "bg-red-500/10 border border-red-500/20 text-red-300" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {triggerResult.error || triggerResult.success === false ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    <span className="font-medium">
                      {triggerResult.error ? "Error" : "Ciclo iniciado"}
                    </span>
                  </div>
                  <p className="opacity-80">
                    {triggerResult.error ?? `Status: ${triggerResult.status ?? "ok"}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Active Campaigns ── */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Campanas Monitoreadas</h2>
              <span className="text-xs text-slate-500">{campaigns.length} activas</span>
            </div>
            {campaigns.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Sin campanas activas detectadas. El backend retornara campanas cuando existan registros en la base de datos.
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {campaigns.map((c) => (
                  <div key={c.campaign_id} className="px-5 py-3 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${statusDot(c.status === "active")}`} />
                        <div>
                          <span className="text-slate-200 text-sm font-medium">{c.name ?? c.campaign_id}</span>
                          {c.type && <span className="ml-2 text-xs text-slate-500">{c.type}</span>}
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${statusColor(c.status)}`}>
                        {c.status ?? "—"}
                      </span>
                    </div>
                    {c.latest_autopilot && (
                      <div className="mt-2 ml-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>
                          Ultimo run: <span className={statusColor(c.latest_autopilot.status)}>{c.latest_autopilot.status}</span>
                        </span>
                        <span>Duracion: {formatMs(c.latest_autopilot.duration_ms)}</span>
                        <span>{formatDate(c.latest_autopilot.completed_at ?? c.latest_autopilot.started_at)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Best Actions ── */}
          {bestActions.length > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/50">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Mejores Acciones Detectadas</h2>
                <p className="text-xs text-slate-500 mt-1">Optimizaciones con mayor impacto registrado</p>
              </div>
              <div className="divide-y divide-slate-700/50">
                {bestActions.map((action) => (
                  <div key={action.id} className="px-5 py-3 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-slate-200 font-medium capitalize">
                          {action.action_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      {action.expected_improvement != null && (
                        <span className="text-xs text-emerald-400 font-mono">
                          +{(action.expected_improvement * 100).toFixed(1)}% esperado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-slate-400">
                      <span>Campana: {action.campaign_id}</span>
                      {action.outcome && (
                        <span className={statusColor(action.outcome)}>Resultado: {action.outcome}</span>
                      )}
                      {action.applied_at && <span>{formatDate(action.applied_at)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ——— Sub-components ———

function StatusCard({
  label,
  value,
  icon,
  active,
  note,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  active: boolean;
  note?: string;
}) {
  return (
    <div className={`rounded-xl border p-4 transition-colors ${active ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-700/50 bg-slate-900/60"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
        <div className={active ? "text-emerald-400" : "text-slate-600"}>{icon}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusDot(active)}`} />
        <span className={`text-lg font-bold ${active ? "text-white" : "text-slate-400"}`}>{value}</span>
      </div>
      {note && <p className="text-[11px] text-slate-500 mt-1">{note}</p>}
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-slate-500 text-xs block">{label}</span>
      <span className={`text-slate-200 text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
