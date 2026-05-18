"use client";

import useSWR from "swr";
import { motion } from "@/lib/motion-stub";
import { Loader2, RefreshCw, Beaker, AlertCircle, CalendarClock } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchObservabilitySla } from "@/lib/admin/observability-api";
import { demoSlaPayload } from "@/lib/admin/observability-demo";
import { SLABreachAlert } from "@/components/admin/observability/SLABreachAlert";

function formatTs(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminObservabilitySlaPage() {
  const { tenantId } = useTenant();
  const { role } = useAuth();
  const roleStr = String(role ?? "");
  const key = tenantId?.trim() ? (["obs-sla", tenantId, roleStr] as const) : null;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(key, async ([, tid]) => fetchObservabilitySla(tid, roleStr), { revalidateOnMount: true });

  const bootstrapping = Boolean(tenantId?.trim() && isLoading && data === undefined);
  const demoMode = Boolean(
    tenantId?.trim() && !bootstrapping && (data === null || !Array.isArray(data?.breaches)),
  );
  const display = demoMode ? demoSlaPayload() : data;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">SLA monitoring</h1>
        <p className="mt-1 text-gray-400">
          Incumplimientos y compromisos. API:{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-gray-300">
            GET /api/v1/tenants/&#123;id&#125;/observability/sla
          </code>{" "}
          · Actualización automática cada 30s (layout SWR)
        </p>
      </motion.div>

      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        {demoMode ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
            <Beaker className="h-3.5 w-3.5" aria-hidden />
            Modo demostración
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => void mutate()}
          disabled={!tenantId || bootstrapping}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50"
        >
          {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </button>
      </div>

      {bootstrapping && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
        </div>
      )}

      {!bootstrapping && !tenantId && (
        <GlassCard className="border-white/10 p-8">
          <p className="m-0 text-gray-400">Selecciona un tenant para monitorear SLA.</p>
        </GlassCard>
      )}

      {!bootstrapping && tenantId && error && (
        <GlassCard className="mb-6 border-amber-500/25 bg-amber-500/5 p-4">
          <p className="m-0 flex items-start gap-2 text-sm text-amber-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            No se pudo leer el API; mostrando datos de demostración.
          </p>
        </GlassCard>
      )}

      {!bootstrapping && tenantId && display && (
        <div className="space-y-6">
          {display.summary ? (
            <GlassCard className="border-white/10 p-5">
              <h2 className="m-0 text-base font-semibold text-white">Resumen</h2>
              <p className="mt-2 mb-0 text-sm text-gray-400">
                <span className="text-2xl font-bold text-white">{display.summary.met_percent}%</span> de objetivos
                cumplidos en ventana <code className="text-gray-300">{display.summary.window}</code>
              </p>
            </GlassCard>
          ) : null}

          <div>
            <h2 className="mb-3 text-lg font-semibold text-white">Alertas activas</h2>
            <SLABreachAlert breaches={display.breaches} />
          </div>

          {display.upcoming_reviews && display.upcoming_reviews.length > 0 ? (
            <GlassCard className="border-white/10 p-5">
              <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-white">
                <CalendarClock className="h-5 w-5 text-sky-400" aria-hidden />
                Próximas revisiones
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                {display.upcoming_reviews.map((u) => (
                  <li
                    key={`${u.name}-${u.due_at}`}
                    className="flex justify-between gap-4 border-b border-white/5 py-2 last:border-0"
                  >
                    <span>{u.name}</span>
                    <span className="shrink-0 text-gray-500">{formatTs(u.due_at)}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ) : null}
        </div>
      )}
    </>
  );
}
