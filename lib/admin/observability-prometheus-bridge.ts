import type { ErrorRatePoint, LatencyPoint, TenantHealthSnapshot } from "@/lib/admin/observability-types";
import {
  buildEndpointLatencyStats,
  buildTenantErrorSlices,
  computeErrorRatePercent,
  parsePrometheusText,
  type EndpointLatencyStats,
  type TenantErrorSlice,
} from "@/lib/admin/prometheus-parse";

export interface PrometheusSnapshot {
  endpoints: EndpointLatencyStats[];
  tenantErrors: TenantErrorSlice[];
  errorRatePct: number | null;
  latencyAggregate: LatencyPoint | null;
}

export function snapshotFromPrometheusText(text: string, tenantId?: string): PrometheusSnapshot {
  const samples = parsePrometheusText(text);
  const endpoints = buildEndpointLatencyStats(samples);
  const tenantErrors = buildTenantErrorSlices(samples);
  const errorRatePct = computeErrorRatePercent(tenantErrors, tenantId);
  const latencyAggregate = aggregateEndpointsToPoint(endpoints);

  return { endpoints, tenantErrors, errorRatePct, latencyAggregate };
}

function aggregateEndpointsToPoint(endpoints: EndpointLatencyStats[], t?: string): LatencyPoint | null {
  if (!endpoints.length) return null;
  const ts = t ?? new Date().toISOString();
  const n = endpoints.length;
  const avg = (getter: (e: EndpointLatencyStats) => number) =>
    endpoints.reduce((s, e) => s + getter(e), 0) / n;
  return {
    t: ts,
    p50: avg((e) => e.p50),
    p95: avg((e) => e.p95),
    p99: avg((e) => e.p99),
  };
}

/** Merge health hints from process metrics (best-effort). */
export function healthHintFromPrometheus(text: string): Partial<TenantHealthSnapshot> {
  const samples = parsePrometheusText(text);
  const up = samples.find(
    (s) => s.name === "up" || s.name.endsWith("_up") || s.name === "process_start_time_seconds",
  );
  const hints: Partial<TenantHealthSnapshot> = {};
  if (up && up.name === "up") {
    hints.status = up.value >= 1 ? "healthy" : "critical";
  }
  return hints;
}

export function buildLatencyPointsFromEndpoints(endpoints: EndpointLatencyStats[]): LatencyPoint[] {
  const t = new Date().toISOString();
  return endpoints.map((e) => ({
    t,
    endpoint: e.endpoint,
    p50: e.p50,
    p95: e.p95,
    p99: e.p99,
  }));
}

export function appendErrorRatePoint(history: ErrorRatePoint[], ratePct: number | null, maxPoints = 48): ErrorRatePoint[] {
  if (ratePct == null) return history;
  const next: ErrorRatePoint = { t: new Date().toISOString(), rate: ratePct };
  const merged = [...history, next];
  return merged.length > maxPoints ? merged.slice(merged.length - maxPoints) : merged;
}
