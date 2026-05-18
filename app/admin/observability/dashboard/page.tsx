"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "@/lib/motion-stub";
import { Loader2, RefreshCw, AlertCircle, Beaker, Eye } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchObservabilityDashboard, fetchPrometheusMetrics } from "@/lib/admin/observability-api";
import {
  appendErrorRatePoint,
  healthHintFromPrometheus,
  snapshotFromPrometheusText,
} from "@/lib/admin/observability-prometheus-bridge";
import {
  demoDashboard,
  demoErrorRateSeries,
  demoHealth,
  demoLatencySeries,
} from "@/lib/admin/observability-demo";
import type {
  ErrorRatePoint,
  LatencyPoint,
  ObservabilityDashboardPayload,
  TenantHealthSnapshot,
} from "@/lib/admin/observability-types";
import { LatencyChart } from "@/components/admin/observability/LatencyChart";
import { ErrorRateChart } from "@/components/admin/observability/ErrorRateChart";
import { TenantHealthCard } from "@/components/admin/observability/TenantHealthCard";
import { MetricsRefreshIndicator } from "@/components/admin/observability/MetricsRefreshIndicator";
import { LatencyHistogram } from "@/components/admin/observability/LatencyHistogram";
import { ErrorRateTimeSeries } from "@/components/admin/observability/ErrorRateTimeSeries";
import { TenantComparison } from "@/components/admin/observability/TenantComparison";
import { resolveObservabilityXRole } from "@/lib/admin/observability-role";

function normalizeDashboard(raw: ObservabilityDashboardPayload | null): ObservabilityDashboardPayload | null {
  if (!raw) return null;
  return {
    health: raw.health ?? demoHealth(),
    latency: Array.isArray(raw.latency) ? raw.latency : [],
    error_rate: Array.isArray(raw.error_rate) ? raw.error_rate : [],
    fetched_at: raw.fetched_at,
  };
}

function mergeHealth(
  jsonHealth: TenantHealthSnapshot | undefined,
  hint: Partial<TenantHealthSnapshot>,
): TenantHealthSnapshot {
  const base = jsonHealth ?? demoHealth();
  return {
    ...base,
    ...hint,
    status: hint.status ?? base.status,
  };
}

export default function AdminObservabilityDashboardPage() {
  const { tenantId } = useTenant();
  const { role } = useAuth();
  const roleStr = String(role ?? "");
  const xRole = resolveObservabilityXRole(roleStr);
  const readOnly = xRole === "BANK_ANALYST";

  const metricsKey = tenantId?.trim() ? (["obs-metrics", tenantId, roleStr] as const) : null;
  const dashboardKey = tenantId?.trim() ? (["obs-dashboard", tenantId, roleStr] as const) : null;

  const {
    data: metricsText,
    error: metricsError,
    isLoading: metricsInitialLoading,
    isValidating: metricsBusy,
    mutate: remetrics,
  } = useSWR(
    metricsKey,
    async ([, tid]) => fetchPrometheusMetrics(tid, roleStr),
    { revalidateOnMount: true },
  );

  const [metricsUpdatedAt, setMetricsUpdatedAt] = useState<number>(() => Date.now());
  useEffect(() => {
    if (metricsText !== undefined) setMetricsUpdatedAt(Date.now());
  }, [metricsText]);

  const {
    data: jsonRaw,
    isLoading: dashInitialLoading,
    mutate: redash,
  } = useSWR(dashboardKey, async ([, tid]) => fetchObservabilityDashboard(tid, roleStr), {
    revalidateOnMount: true,
  });

  const promSnap = useMemo(
    () => (metricsText != null ? snapshotFromPrometheusText(metricsText, tenantId ?? undefined) : null),
    [metricsText, tenantId],
  );

  const [latHistory, setLatHistory] = useState<LatencyPoint[]>([]);
  const [errHistory, setErrHistory] = useState<ErrorRatePoint[]>([]);

  useEffect(() => {
    setLatHistory([]);
    setErrHistory([]);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId?.trim() || metricsText == null) return;
    const snap = snapshotFromPrometheusText(metricsText, tenantId);
    setErrHistory((h) => appendErrorRatePoint(h, snap.errorRatePct));
    if (snap.latencyAggregate) {
      setLatHistory((h) => {
        const next = [...h, snap.latencyAggregate!];
        return next.length > 48 ? next.slice(next.length - 48) : next;
      });
    }
  }, [metricsText, tenantId]);

  const jsonDash = useMemo(() => normalizeDashboard(jsonRaw ?? null), [jsonRaw]);

  const healthHint = useMemo(
    () => (metricsText != null ? healthHintFromPrometheus(metricsText) : {}),
    [metricsText],
  );

  const hasPromCharts =
    (promSnap?.endpoints.length ?? 0) > 0 ||
    promSnap?.errorRatePct != null ||
    (promSnap?.tenantErrors.length ?? 0) > 0;

  const hasJsonCharts = Boolean(
    jsonDash && (jsonDash.latency.length > 0 || jsonDash.error_rate.length > 0),
  );
  const hasJsonPayload = jsonRaw !== undefined && jsonRaw !== null;

  const display = useMemo((): ObservabilityDashboardPayload | null => {
    if (!tenantId?.trim()) return null;

    const health = mergeHealth(jsonDash?.health, healthHint);

    if (hasJsonCharts || hasPromCharts) {
      const latencyFromJson = jsonDash?.latency?.length ? jsonDash.latency : [];
      const errFromJson = jsonDash?.error_rate?.length ? jsonDash.error_rate : [];

      const latencyFromHistogram =
        promSnap?.endpoints?.map((e) => ({
          t: new Date().toISOString(),
          endpoint: e.endpoint,
          p50: e.p50,
          p95: e.p95,
          p99: e.p99,
        })) ?? [];

      const lineLatency =
        latHistory.length > 0
          ? latHistory
          : latencyFromJson.length > 0
            ? latencyFromJson
            : latencyFromHistogram.length > 0
              ? latencyFromHistogram
              : demoLatencySeries();

      const lineError =
        errHistory.length > 0
          ? errHistory
          : errFromJson.length > 0
            ? errFromJson
            : promSnap?.errorRatePct != null
              ? [{ t: new Date().toISOString(), rate: promSnap.errorRatePct }]
              : demoErrorRateSeries();

      return {
        health,
        latency: lineLatency,
        error_rate: lineError,
        fetched_at: jsonDash?.fetched_at ?? new Date().toISOString(),
      };
    }

    if (jsonDash) {
      return {
        health,
        latency: latHistory.length > 0 ? latHistory : demoLatencySeries(),
        error_rate: errHistory.length > 0 ? errHistory : demoErrorRateSeries(),
        fetched_at: jsonDash.fetched_at,
      };
    }

    return { ...demoDashboard(), health: mergeHealth(demoDashboard().health, healthHint) };
  }, [
    tenantId,
    jsonDash,
    healthHint,
    hasJsonCharts,
    hasPromCharts,
    promSnap,
    latHistory,
    errHistory,
    jsonRaw,
  ]);

  const bootstrapping = Boolean(
    tenantId?.trim() &&
      ((jsonRaw === undefined && dashInitialLoading) ||
        (metricsText === undefined && metricsInitialLoading)),
  );

  const demoMode = Boolean(
    tenantId?.trim() &&
      !bootstrapping &&
      !hasJsonCharts &&
      !hasPromCharts &&
      !hasJsonPayload,
  );

  const lineLatency = useMemo(() => {
    const series = display?.latency ?? [];
    const aggregateOnly = series.filter((p) => p.endpoint == null || p.endpoint === "");
    if (latHistory.length > 0) return latHistory;
    if (aggregateOnly.some((p) => p.p50 != null)) return aggregateOnly;
    return series;
  }, [display?.latency, latHistory]);

  const lineError = errHistory.length > 0 ? errHistory : (display?.error_rate ?? []);

  const loading = bootstrapping;

  const refetchAll = () => {
    void remetrics();
    void redash();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard de observabilidad</h1>
        <p className="mt-1 max-w-3xl text-gray-400">
          Vista consolidada: métricas Prometheus en{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-gray-300">GET /metrics</code> y API JSON{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-gray-300">
            GET /api/v1/tenants/&#123;id&#125;/observability/dashboard
          </code>
          . Encabezado <code lang="en">X-Role</code>: <span className="text-gray-200">{xRole}</span>
        </p>
      </motion.div>

      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        {readOnly ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-100">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Solo lectura (analyst)
          </span>
        ) : null}
        {demoMode ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
            <Beaker className="h-3.5 w-3.5" aria-hidden />
            Modo demostración
          </span>
        ) : null}
        {tenantId?.trim() ? (
          <MetricsRefreshIndicator
            dataUpdatedAt={metricsUpdatedAt || Date.now()}
            isValidating={metricsBusy}
            refreshIntervalMs={30_000}
            error={metricsError}
          />
        ) : null}
        <button
          type="button"
          onClick={() => void refetchAll()}
          disabled={loading || !tenantId}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50"
        >
          {metricsBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
        </div>
      )}

      {!loading && !tenantId && (
        <GlassCard className="border-white/10 p-8">
          <p className="m-0 text-gray-400">Selecciona un tenant para cargar métricas reales.</p>
        </GlassCard>
      )}

      {!loading && tenantId && metricsError && (
        <GlassCard className="mb-6 border-amber-500/25 bg-amber-500/5 p-4">
          <p className="m-0 flex items-start gap-2 text-sm text-amber-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            No se pudo leer <code>/metrics</code>; revisa el proxy y el backend.
          </p>
        </GlassCard>
      )}

      {!loading && tenantId && display && (
        <div className="space-y-6">
          <TenantHealthCard health={display.health} />

          <GlassCard className="border-white/10 p-5">
            <h2 className="m-0 text-lg font-semibold text-white">Histograma de latencia por endpoint</h2>
            <p className="mt-1 text-sm text-gray-500">p50 / p95 / p99 estimados desde histogramas Prometheus</p>
            <div className="mt-4">
              <LatencyHistogram endpoints={promSnap?.endpoints ?? []} height={320} />
            </div>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="border-white/10 p-5">
              <h2 className="m-0 text-lg font-semibold text-white">Latencia agregada</h2>
              <p className="mt-1 text-sm text-gray-500">Serie desde muestreos de /metrics (buffer local)</p>
              <div className="mt-4">
                <LatencyChart points={lineLatency} height={300} />
              </div>
            </GlassCard>
            <GlassCard className="border-white/10 p-5">
              <h2 className="m-0 text-lg font-semibold text-white">Tasa de error</h2>
              <p className="mt-1 text-sm text-gray-500">Instantáneo y/o serie bufferizada</p>
              <div className="mt-4">
                <ErrorRateChart points={lineError} height={280} />
              </div>
            </GlassCard>
          </div>

          <GlassCard className="border-white/10 p-5">
            <h2 className="m-0 text-lg font-semibold text-white">Errores en el tiempo</h2>
            <p className="mt-1 text-sm text-gray-500">Histórico derivado del polling de /metrics (30s)</p>
            <div className="mt-4">
              <ErrorRateTimeSeries points={errHistory} height={280} />
            </div>
          </GlassCard>

          <GlassCard className="border-white/10 p-5">
            <h2 className="m-0 text-lg font-semibold text-white">Comparación por tenant</h2>
            <p className="mt-1 text-sm text-gray-500">
              Requiere contadores con label de tenant en /metrics; oculto si solo hay un tenant en la muestra
            </p>
            <div className="mt-4">
              <TenantComparison
                slices={promSnap?.tenantErrors ?? []}
                activeTenantId={tenantId ?? undefined}
                height={300}
              />
            </div>
          </GlassCard>

          {display.fetched_at ? (
            <p className="text-center text-xs text-gray-500">
              Última actualización panel JSON / agregación: {new Date(display.fetched_at).toLocaleString("es-ES")}
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}
