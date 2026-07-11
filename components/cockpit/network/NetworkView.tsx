"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchNetworkHealth, fetchCoresSummary, fetchActivity, fetchOpenAlerts } from "@/lib/cockpit/api/observability";
import { mergeToSixCores } from "@/lib/cockpit/core-registry";
import { demoCoreByCode } from "@/lib/cockpit/demo";
import type { PlatformCoreCode } from "@/lib/cockpit/core-registry";
import { CORE_CHIP_DOT } from "@/lib/cockpit/core-registry";
import type { ActivityItem, AlertItem } from "@/lib/cockpit/types";
import { NetworkHealthCard } from "./NetworkHealthCard";
import { CoreCard } from "./CoreCard";

export function NetworkView() {
  const [health, setHealth] = useState<Awaited<ReturnType<typeof fetchNetworkHealth>> | null>(null);
  const [cores, setCores] = useState<ReturnType<typeof mergeToSixCores>>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, c, a, al] = await Promise.all([
        fetchNetworkHealth(),
        fetchCoresSummary(),
        fetchActivity(10),
        fetchOpenAlerts(),
      ]);
      setHealth(h);
      setCores(mergeToSixCores(c.data.cores ?? [], (code) => demoCoreByCode(code as PlatformCoreCode)));
      setActivity(a.data.items ?? []);
      setAlerts(al.data.alerts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const h = health?.data;
  const healthDemo = health?.isDemo ?? false;
  const coresDemo = health?.isDemo ?? false;

  const longDate = new Date().toLocaleDateString("es-DO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const servDot =
    h?.semaphore === "green" ? "green" : h?.semaphore === "red" ? "red" : ("yellow" as const);
  const servLabel = servDot === "green" ? "Operativo" : servDot === "red" ? "Caído" : "Degradado";

  if (loading && !h) {
    return <p className="text-cockpit-muted">Cargando vista de red…</p>;
  }

  return (
    <div className="space-y-6" data-testid="cockpit-network-view">
      <header>
        <h1 className="text-[32px] font-semibold text-cockpit-text">Vista de Red</h1>
        <p className="text-sm text-cockpit-muted">Estado global de la plataforma Nadakki · {longDate}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <NetworkHealthCard label="Tenants activos" value={String(h?.active_tenants ?? "—")} isDemo={healthDemo} />
        <NetworkHealthCard label="Operaciones hoy" value={String(h?.operations_today ?? "—")} isDemo={healthDemo} />
        <NetworkHealthCard
          label="Alertas activas"
          value={String(h?.open_alerts ?? 0)}
          alert={(h?.open_alerts ?? 0) > 0}
          isDemo={healthDemo}
        />
        <NetworkHealthCard label="Servicios" value="" dot={servDot} dotLabel={servLabel} isDemo={healthDemo} />
        <NetworkHealthCard
          label="Uptime"
          value={h?.uptime_pct != null ? `${h.uptime_pct}%` : "—"}
          isDemo={healthDemo}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cores.map((core) => (
          <CoreCard key={core.core_code} core={core} isDemo={coresDemo || core.data_source === "none"} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-cockpit-text">Actividad reciente</h2>
          <ul className="space-y-3 text-sm">
            {activity.map((item) => (
              <li key={item.id} className="flex gap-2 border-b border-cockpit-border/60 pb-2 last:border-0">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: CORE_CHIP_DOT[item.core_code] ?? "#64748b" }}
                />
                <div>
                  <p className="text-cockpit-text">{item.message}</p>
                  <p className="text-xs text-cockpit-muted">
                    {item.core_code} · {item.actor ?? "—"} ·{" "}
                    {new Date(item.at).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-cockpit-text">Alertas abiertas</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-cockpit-muted">Sin alertas abiertas</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.map((a) => (
                <li key={a.id} className="flex gap-2 rounded-lg border border-cockpit-border p-2">
                  <SeverityPill severity={a.severity} />
                  <div>
                    <span className="text-xs text-cockpit-muted">{a.core_code}</span>
                    <p className="font-medium text-cockpit-text">{a.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function SeverityPill({ severity }: { severity: string }) {
  const s = severity.toUpperCase();
  const cls =
    s === "HIGH" || s === "CRITICAL"
      ? "bg-cockpit-err/20 text-cockpit-err"
      : s === "MEDIUM"
        ? "bg-cockpit-warn/20 text-cockpit-warn"
        : "bg-cockpit-muted/20 text-cockpit-muted";
  return (
    <span className={`self-start rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{s}</span>
  );
}
