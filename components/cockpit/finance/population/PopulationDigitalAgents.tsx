"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchPopulationDigitalAgents } from "@/lib/cockpit/api/financePopulation";
import { formatInteger, formatPercent } from "@/lib/cockpit/format";
import { useCockpit } from "@/lib/cockpit/context";
import { NetworkHealthCard } from "@/components/cockpit/network/NetworkHealthCard";

export function PopulationDigitalAgents() {
  const { locale } = useCockpit();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPopulationDigitalAgents>> | null>(null);

  const load = useCallback(async () => {
    setData(await fetchPopulationDigitalAgents());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const d = data?.data;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Nauta — Fuerza laboral digital</h2>
        {data?.isDemo ? (
          <p className="mt-1 text-sm text-cockpit-muted">
            <DataTruthBadge level="DEMO" /> Nauta aún no expone métricas de runs en vivo.
          </p>
        ) : null}
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <NetworkHealthCard
          label="Agentes activos"
          value={formatInteger(d?.total_active_agents ?? 0, locale)}
          isDemo={data?.isDemo}
        />
        <NetworkHealthCard
          label="Ejecuciones / día"
          value={formatInteger(d?.executions_per_day ?? 0, locale)}
          isDemo={data?.isDemo}
        />
        <NetworkHealthCard
          label="Tasa de éxito"
          value={formatPercent(d?.success_rate_pct ?? 0, locale)}
          isDemo={data?.isDemo}
        />
      </div>
      <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
        <h3 className="mb-2 text-sm font-semibold">Agentes RPA por tenant</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-cockpit-muted">
            <tr>
              <th className="py-1 text-left">Tenant</th>
              <th className="py-1 text-right">Activos</th>
            </tr>
          </thead>
          <tbody>
            {(d?.by_tenant ?? []).map((r) => (
              <tr key={r.tenant_id} className="border-t border-cockpit-border">
                <td className="py-1.5">{r.tenant_name}</td>
                <td className="py-1.5 text-right font-cockpitMono tabular-nums">{r.active_agents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
