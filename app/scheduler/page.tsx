"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "@/lib/motion-stub";
import Link from "next/link";
import { Clock, Calendar, ArrowRight, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  fetchSchedulerStatus,
  formatBool,
  type SchedulerStatusPayload,
} from "@/lib/scheduler-status";

export default function SchedulerPage() {
  const [data, setData] = useState<SchedulerStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchSchedulerStatus();
    if (res.ok) {
      setData(res.data);
    } else {
      setData(null);
      setError((res as { ok: false; error: string }).error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ame = data?.ame_autopilot;

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge
          status={data?.running ? "active" : data?.enabled ? "warning" : "inactive"}
          label="Scheduler"
          size="lg"
        />
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Motor de Ejecucion</h1>
              <p className="text-gray-400">Scheduler operativo — estado en tiempo real</p>
              {data?.timestamp && (
                <p className="text-xs text-gray-500 mt-1 font-mono">Servidor: {data.timestamp}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white hover:bg-white/15 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </motion.div>

      {error && (
        <GlassCard className="p-4 mb-6 border-amber-500/30 bg-amber-500/10">
          <div className="flex items-start gap-3 text-amber-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">No se pudo cargar el estado</p>
              <p className="text-amber-200/80 mt-1">{error}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          Cargando estado del scheduler
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              value={formatBool(data.enabled)}
              label="Habilitado (SCHEDULER_ENABLED)"
              icon={<Clock className="w-6 h-6 text-orange-400" />}
              color="#f97316"
            />
            <StatCard
              value={formatBool(data.running)}
              label="En ejecucion"
              icon={<Clock className="w-6 h-6 text-blue-400" />}
              color="#3b82f6"
            />
            <StatCard
              value={data.jobs_count ?? 0}
              label="Jobs registrados"
              icon={<Calendar className="w-6 h-6 text-cyan-400" />}
              color="#22d3ee"
            />
            <StatCard
              value={data.mode ?? "—"}
              label="Modo"
              icon={<Clock className="w-6 h-6 text-green-400" />}
              color="#22c55e"
            />
          </div>

          <GlassCard className="p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">AME Autopilot</h2>
            {ame ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">job_id</dt>
                  <dd className="text-white font-mono">{ame.job_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">schedule</dt>
                  <dd className="text-white">{ame.schedule ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">job_running</dt>
                  <dd className="text-white">{formatBool(ame.job_running)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">dry_run_mode</dt>
                  <dd className="text-white">{formatBool(ame.dry_run_mode)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">last_run_at</dt>
                  <dd className="text-white font-mono text-xs break-all">{ame.last_run_at ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">last_error</dt>
                  <dd className="text-red-300/90 text-xs break-all">{ame.last_error ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">last_run_summary</dt>
                  <dd className="text-gray-300 text-xs break-all">{ame.last_run_summary ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">next_timeslices</dt>
                  <dd className="text-gray-300 font-mono text-xs">
                    {ame.next_timeslices?.length ? ame.next_timeslices.join(", ") : "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-gray-500 text-sm">Sin bloque ame_autopilot en la respuesta.</p>
            )}
            {data.tenant_support !== undefined && (
              <p className="text-xs text-gray-500 mt-4">tenant_support: {String(data.tenant_support)}</p>
            )}
          </GlassCard>
        </>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/scheduler/jobs">
          <GlassCard className="p-6 cursor-pointer group h-full">
            <h3 className="text-lg font-bold text-white group-hover:text-orange-400">Resumen de jobs</h3>
            <p className="text-sm text-gray-400 mt-1">
              Misma fuente de verdad (solo lectura). La API no lista nombres de jobs individuales.
            </p>
            <ArrowRight className="w-5 h-5 text-gray-500 mt-4 group-hover:translate-x-1 transition-transform" />
          </GlassCard>
        </Link>
        <GlassCard className="p-6 opacity-75 border-dashed border-white/20">
          <h3 className="text-lg font-bold text-gray-400">Alta de jobs</h3>
          <p className="text-sm text-gray-500 mt-2">
            No hay endpoint publico para crear o editar jobs. Esta accion no esta disponible en la API
            actual.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
