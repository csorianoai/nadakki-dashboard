"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchPopulationActivity } from "@/lib/cockpit/api/financePopulation";
import { CORE_DISPLAY_FALLBACK, type PlatformCoreCode } from "@/lib/cockpit/core-registry";
import { formatInteger } from "@/lib/cockpit/format";
import { useCockpit } from "@/lib/cockpit/context";

const GRID = "#1e1e2e";
const AXIS = "#8b8b99";
const TOOLTIP = { background: "#111118", border: "1px solid #1e1e2e", color: "#e5e5ef" };

const PERIODS = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
] as const;

export function PopulationActivity() {
  const { locale } = useCockpit();
  const [period, setPeriod] = useState<string>("week");
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPopulationActivity>> | null>(null);

  const load = useCallback(async () => {
    setData(await fetchPopulationActivity(period));
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = (data?.data.by_core ?? []).map((c) => ({
    name: CORE_DISPLAY_FALLBACK[c.core_code as PlatformCoreCode] ?? c.core_code,
    mau: c.mau ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-cockpit-muted">Período</span>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`rounded px-3 py-1 text-xs ${
              period === p.id ? "bg-cockpit-accent/20 text-cockpit-text" : "text-cockpit-muted"
            }`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
        {data?.isDemo ? <DataTruthBadge level="DEMO" /> : null}
      </div>
      <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
        <h3 className="mb-2 text-sm font-semibold">MAU por core</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid stroke={GRID} />
            <XAxis dataKey="name" stroke={AXIS} tick={{ fontSize: 10 }} />
            <YAxis stroke={AXIS} tick={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP} />
            <Bar dataKey="mau" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
        <h3 className="mb-2 text-sm font-semibold">Tenants inactivos</h3>
        <ul className="space-y-2 text-sm">
          {(data?.data.inactive_tenants ?? []).map((t) => (
            <li key={t.tenant_id} className="flex items-center justify-between border-t border-cockpit-border pt-2">
              <span>{t.tenant_name}</span>
              <span className="flex items-center gap-2">
                <span className="font-cockpitMono tabular-nums text-cockpit-muted">
                  {formatInteger(t.activity_score, locale)}
                </span>
                {t.churn_risk ? (
                  <span className="rounded bg-cockpit-err/20 px-2 py-0.5 text-xs text-cockpit-err">riesgo churn</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
