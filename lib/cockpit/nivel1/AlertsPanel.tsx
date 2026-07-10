"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchOpenAlerts } from "../api/observability";
import { DemoPanelBadge } from "../components/DemoPanelBadge";
import { PanelError, PanelFrame, PanelSkeleton } from "../components/PanelFrame";
import type { AlertItem } from "../types";

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOpenAlerts();
      setAlerts(res.data.alerts ?? []);
      setIsDemo(res.isDemo);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar alertas");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PanelFrame title="Alertas abiertas" badge={isDemo ? <DemoPanelBadge /> : undefined} testId="cockpit-alerts">
      {loading ? <PanelSkeleton /> : null}
      {!loading && error && alerts.length === 0 ? <PanelError message={error} onRetry={load} /> : null}
      {!loading && alerts.length === 0 && !error ? (
        <p className="text-sm text-[var(--ch-text-3)]">Sin alertas abiertas.</p>
      ) : null}
      {!loading && alerts.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {alerts.map((a) => (
            <li key={a.id} className="rounded border border-[var(--ch-line)] p-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase ${severityClass(a.severity)}`}>{a.severity}</span>
                <span className="text-xs text-[var(--ch-text-3)]">{a.core_code}</span>
              </div>
              <p className="mt-1 font-medium">{a.title}</p>
              {a.message ? <p className="text-xs text-[var(--ch-text-3)]">{a.message}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </PanelFrame>
  );
}

function severityClass(s: string): string {
  if (s === "critical" || s === "high") return "text-[var(--ch-danger-text)]";
  if (s === "medium") return "text-[var(--ch-warning-text)]";
  return "text-[var(--ch-text-3)]";
}
