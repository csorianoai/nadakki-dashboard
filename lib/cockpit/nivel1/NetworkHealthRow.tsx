"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchNetworkHealth } from "../api/observability";
import { DemoPanelBadge } from "../components/DemoPanelBadge";
import { PanelError, PanelFrame, PanelSkeleton } from "../components/PanelFrame";
import type { NetworkHealthResponse } from "../types";

const SEMAPHORE_COLORS = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" } as const;

export function NetworkHealthRow() {
  const [data, setData] = useState<NetworkHealthResponse | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNetworkHealth();
      setData(res.data);
      setIsDemo(res.isDemo);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar salud de red");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sem = data?.semaphore ?? "unknown";
  const semColor = sem in SEMAPHORE_COLORS ? SEMAPHORE_COLORS[sem as keyof typeof SEMAPHORE_COLORS] : "#94a3b8";

  return (
    <PanelFrame title="Salud de la red" badge={isDemo ? <DemoPanelBadge /> : undefined} testId="cockpit-network-health">
      {loading ? <PanelSkeleton rows={2} /> : null}
      {!loading && error && !data ? <PanelError message={error} onRetry={load} /> : null}
      {!loading && data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Metric label="Tenants activos" value={String(data.active_tenants ?? "—")} />
          <Metric label="Operaciones hoy" value={String(data.operations_today ?? "—")} />
          <Metric
            label="Alertas abiertas"
            value={String(data.open_alerts ?? 0)}
            alert={(data.open_alerts ?? 0) > 0}
          />
          <div>
            <p className="text-xs text-[var(--ch-text-3)]">Semáforo</p>
            <span className="mt-1 inline-block h-3 w-3 rounded-full" style={{ background: semColor }} aria-label={sem} />
          </div>
          <Metric label="Uptime" value={data.uptime_pct != null ? `${data.uptime_pct}%` : "—"} />
        </div>
      ) : null}
    </PanelFrame>
  );
}

function Metric({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[var(--ch-text-3)]">{label}</p>
      <p className={`text-lg font-semibold ${alert ? "text-[var(--ch-danger-text)]" : ""}`}>{value}</p>
    </div>
  );
}
