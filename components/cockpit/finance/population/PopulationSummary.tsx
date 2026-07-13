"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchPopulationSummary, fetchTopTenants, fetchTopUsers } from "@/lib/cockpit/api/financePopulation";
import { formatInteger } from "@/lib/cockpit/format";
import { useCockpit } from "@/lib/cockpit/context";
import { NetworkHealthCard } from "@/components/cockpit/network/NetworkHealthCard";

export function PopulationSummary() {
  const { locale } = useCockpit();
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof fetchPopulationSummary>> | null>(null);
  const [topT, setTopT] = useState<Awaited<ReturnType<typeof fetchTopTenants>> | null>(null);
  const [topU, setTopU] = useState<Awaited<ReturnType<typeof fetchTopUsers>> | null>(null);

  const load = useCallback(async () => {
    const [s, tt, tu] = await Promise.all([fetchPopulationSummary(), fetchTopTenants(10), fetchTopUsers(10)]);
    setSummary(s);
    setTopT(tt);
    setTopU(tu);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isDemo = summary?.isDemo || topT?.isDemo || topU?.isDemo;
  const s = summary?.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NetworkHealthCard
          label="Profesionales"
          value={formatInteger(s?.total_professionals ?? 0, locale)}
          isDemo={summary?.isDemo}
        />
        <NetworkHealthCard
          label="Entidades conectadas"
          value={formatInteger(s?.total_entities_connected ?? 0, locale)}
          isDemo={summary?.isDemo}
        />
        <NetworkHealthCard
          label="Agentes digitales"
          value={formatInteger(s?.total_digital_agents_active ?? 0, locale)}
          isDemo={summary?.isDemo}
        />
        <NetworkHealthCard
          label="Tenants gestionados"
          value={formatInteger(s?.tenants_managed ?? 0, locale)}
          isDemo={summary?.isDemo}
        />
      </div>
      {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <TopTable title="Top 10 tenants" isDemo={topT?.isDemo} rows={topT?.data.items ?? []} kind="tenant" />
        <TopTable title="Top 10 usuarios" isDemo={topU?.isDemo} rows={topU?.data.items ?? []} kind="user" />
      </div>
    </div>
  );
}

function TopTable({
  title,
  isDemo,
  rows,
  kind,
}: {
  title: string;
  isDemo?: boolean;
  rows: Array<{ activity_score: number; tenant_name?: string; user_name?: string }>;
  kind: "tenant" | "user";
}) {
  return (
    <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-cockpit-muted">
          <tr>
            <th className="py-1 text-left">Nombre</th>
            <th className="py-1 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-cockpit-border">
              <td className="py-1.5">
                {kind === "tenant" ? (r as { tenant_name: string }).tenant_name : (r as { user_name: string }).user_name}
              </td>
              <td className="py-1.5 text-right font-cockpitMono tabular-nums">{r.activity_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
