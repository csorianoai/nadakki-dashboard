"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  fetchSchedulerStatus,
  formatBool,
  type SchedulerStatusPayload,
} from "@/lib/scheduler-status";

export default function SchedulerJobsPage() {
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
      <NavigationBar backHref="/scheduler">
        <StatusBadge status="active" label="Jobs (solo lectura)" size="lg" />
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Programacion</h1>
              <p className="text-gray-400">
                Datos en vivo desde{" "}
                <span className="font-mono text-xs">GET /api/v1/scheduler/status</span>
              </p>
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
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        </GlassCard>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          Cargando
        </div>
      ) : data ? (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-white font-semibold mb-4">Resumen del scheduler</h2>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>
                <span className="text-gray-500">enabled:</span> {formatBool(data.enabled)}
              </li>
              <li>
                <span className="text-gray-500">running:</span> {formatBool(data.running)}
              </li>
              <li>
                <span className="text-gray-500">jobs_count:</span>{" "}
                <span className="text-white font-mono">{data.jobs_count ?? 0}</span>
              </li>
              <li>
                <span className="text-gray-500">mode:</span>{" "}
                <span className="text-white font-mono">{data.mode ?? "—"}</span>
              </li>
              {data.timestamp && (
                <li>
                  <span className="text-gray-500">timestamp:</span>{" "}
                  <span className="text-gray-400 font-mono text-xs">{data.timestamp}</span>
                </li>
              )}
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              La API no devuelve el listado de nombres de jobs ni acciones de pausa o eliminacion.
            </p>
          </GlassCard>

          {ame && (
            <GlassCard className="p-6">
              <h2 className="text-white font-semibold mb-4">AME Autopilot</h2>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>
                  <span className="text-gray-500">job_running:</span> {formatBool(ame.job_running)}
                </li>
                <li>
                  <span className="text-gray-500">dry_run_mode:</span> {formatBool(ame.dry_run_mode)}
                </li>
                <li>
                  <span className="text-gray-500">last_run_at:</span>{" "}
                  <span className="font-mono text-xs text-gray-400">{ame.last_run_at ?? "—"}</span>
                </li>
                <li>
                  <span className="text-gray-500">next_timeslices:</span>{" "}
                  <span className="font-mono text-xs">
                    {ame.next_timeslices?.length ? ame.next_timeslices.join(", ") : "—"}
                  </span>
                </li>
              </ul>
            </GlassCard>
          )}
        </div>
      ) : null}
    </div>
  );
}
