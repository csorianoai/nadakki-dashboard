export type HealthStatus = "healthy" | "degraded" | "critical";

export interface LatencyPoint {
  t: string;
  p50?: number;
  p95?: number;
  p99?: number;
  /** Optional route/handler label when point is per-endpoint */
  endpoint?: string;
}

export interface ErrorRatePoint {
  t: string;
  /** Error rate as percentage 0–100 */
  rate: number;
}

export interface TenantHealthSnapshot {
  status: HealthStatus;
  uptime_pct?: number;
  open_incidents?: number;
  last_deploy_at?: string;
  region?: string;
  notes?: string;
}

export interface SlaBreach {
  id: string;
  name: string;
  target_ms?: number;
  actual_ms?: number;
  severity: "warning" | "critical";
  since?: string;
  message?: string;
}

export interface SlaMonitoringPayload {
  breaches: SlaBreach[];
  upcoming_reviews?: { name: string; due_at: string }[];
  summary?: { met_percent: number; window: string };
}

export interface AuditTrailRow {
  id: string;
  ts: string;
  actor?: string;
  action: string;
  resource?: string;
  status?: string;
  trace_id?: string;
}

export interface ObservabilityDashboardPayload {
  health: TenantHealthSnapshot;
  latency: LatencyPoint[];
  error_rate: ErrorRatePoint[];
  fetched_at?: string;
}

export interface AuditTrailPayload {
  events: AuditTrailRow[];
  fetched_at?: string;
}
