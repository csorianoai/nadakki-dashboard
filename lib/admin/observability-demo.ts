import type {
  AuditTrailPayload,
  AuditTrailRow,
  ErrorRatePoint,
  LatencyPoint,
  ObservabilityDashboardPayload,
  SlaMonitoringPayload,
  TenantHealthSnapshot,
} from "@/lib/admin/observability-types";

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

export function demoLatencySeries(): LatencyPoint[] {
  const base = Date.now();
  return Array.from({ length: 12 }, (_, i) => {
    const t = new Date(base - (11 - i) * 15 * 60_000).toISOString();
    const wobble = Math.sin(i / 2) * 12;
    return {
      t,
      p50: Math.round(45 + wobble + i),
      p95: Math.round(120 + wobble * 1.5 + i * 3),
      p99: Math.round(220 + wobble * 2 + i * 4),
    };
  });
}

export function demoErrorRateSeries(): ErrorRatePoint[] {
  return demoLatencySeries().map((p, i) => ({
    t: p.t,
    rate: Math.max(0, Math.min(100, 0.4 + i * 0.15 + (i % 3) * 0.2)),
  }));
}

export function demoHealth(): TenantHealthSnapshot {
  return {
    status: "healthy",
    uptime_pct: 99.94,
    open_incidents: 0,
    last_deploy_at: hoursAgo(6),
    region: "mx-central-1",
    notes: "Todos los chequeos de sintéticos en verde.",
  };
}

export function demoDashboard(): ObservabilityDashboardPayload {
  return {
    health: demoHealth(),
    latency: demoLatencySeries(),
    error_rate: demoErrorRateSeries(),
    fetched_at: new Date().toISOString(),
  };
}

export function demoAuditRows(): AuditTrailRow[] {
  return [
    {
      id: "1",
      ts: hoursAgo(0.1),
      actor: "analyst@tenant",
      action: "credit.decide",
      resource: "application/8f2a…",
      status: "201",
      trace_id: "tr_01jx4",
    },
    {
      id: "2",
      ts: hoursAgo(0.5),
      actor: "system",
      action: "webhook.ingest",
      resource: "partner/acme",
      status: "200",
      trace_id: "tr_01jx3",
    },
    {
      id: "3",
      ts: hoursAgo(2),
      actor: "admin@tenant",
      action: "config.update",
      resource: "tenant/branding",
      status: "204",
      trace_id: "tr_01jx2",
    },
    {
      id: "4",
      ts: hoursAgo(8),
      actor: "dealer@tenant",
      action: "document.upload",
      resource: "application/91c1…",
      status: "422",
      trace_id: "tr_01jx1",
    },
  ];
}

export function demoAuditTrail(): AuditTrailPayload {
  return { events: demoAuditRows(), fetched_at: new Date().toISOString() };
}

export function demoSlaPayload(): SlaMonitoringPayload {
  return {
    breaches: [
      {
        id: "b1",
        name: "API p95 latencia",
        target_ms: 800,
        actual_ms: 940,
        severity: "warning",
        since: hoursAgo(1),
        message: "Ventana móvil 1h supera objetivo en +17%.",
      },
    ],
    upcoming_reviews: [
      { name: "Revisión trimestral SLA", due_at: new Date(Date.now() + 86400_000 * 5).toISOString() },
    ],
    summary: { met_percent: 97.2, window: "rolling_24h" },
  };
}
