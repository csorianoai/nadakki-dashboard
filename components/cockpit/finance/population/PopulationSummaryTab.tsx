"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCockpitInteger } from "@/lib/cockpit/finance-v3/format";
import {
  fetchPopulationSummary,
  fetchPopulationTopTenants,
  fetchPopulationTopUsers,
} from "@/lib/cockpit/api/population";
import type {
  PopulationSummaryEnvelope,
  TopTenantsEnvelope,
  TopUsersEnvelope,
} from "@/lib/cockpit/finance-v3/contracts/population";
import {
  PopulationErrorBanner,
  PopulationNonePlaceholder,
  PopulationPanel,
} from "./PopulationPanel";

export function PopulationSummaryTab() {
  const [summary, setSummary] = useState<PopulationSummaryEnvelope | null>(null);
  const [topTenants, setTopTenants] = useState<TopTenantsEnvelope | null>(null);
  const [topUsers, setTopUsers] = useState<TopUsersEnvelope | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      fetchPopulationSummary(),
      fetchPopulationTopTenants(10),
      fetchPopulationTopUsers(10),
    ]);
    const errs: string[] = [];
    if (results[0].status === "fulfilled" && results[0].value.status === "ok") {
      setSummary(results[0].value.envelope);
    } else {
      setSummary(null);
      errs.push(
        results[0].status === "rejected"
          ? String(results[0].reason)
          : results[0].value.status === "error"
            ? results[0].value.error
            : "Resumen no disponible",
      );
    }
    if (results[1].status === "fulfilled" && results[1].value.status === "ok") {
      setTopTenants(results[1].value.envelope);
    } else {
      setTopTenants(null);
      errs.push("Top tenants no disponible");
    }
    if (results[2].status === "fulfilled" && results[2].value.status === "ok") {
      setTopUsers(results[2].value.envelope);
    } else {
      setTopUsers(null);
      errs.push("Top users no disponible");
    }
    setErrors(errs);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-cockpit-muted">Cargando resumen…</p>;

  const kpis = summary
    ? [
        { label: "Profesionales", value: summary.data.total_professionals },
        { label: "Entidades", value: summary.data.total_entities_connected },
        { label: "Agentes digitales", value: summary.data.total_digital_agents_active },
        { label: "Tenants gestionados", value: summary.data.tenants_managed },
      ]
    : [];

  return (
    <div className="space-y-4" data-testid="population-tab-summary">
      {errors.map((e) => (
        <PopulationErrorBanner key={e} message={e} />
      ))}
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
              <p className="text-[11px] uppercase text-cockpit-muted">{k.label}</p>
              <p className="font-cockpitMono text-2xl tabular-nums">{formatCockpitInteger(k.value)}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {topTenants ? (
          <PopulationPanel title="Top 10 tenants" dataSource={topTenants.data_source}>
            {topTenants.data_source === "none" ? (
              <PopulationNonePlaceholder message="Sin datos de actividad" />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-cockpit-muted">
                  <tr>
                    <th className="py-1 text-left">Tenant</th>
                    <th className="py-1 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topTenants.data.items.map((t) => (
                    <tr key={t.tenant_id} className="border-t border-cockpit-border">
                      <td className="py-1">{t.tenant_name}</td>
                      <td className="py-1 text-right font-mono tabular-nums">{t.activity_score.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </PopulationPanel>
        ) : null}
        {topUsers ? (
          <PopulationPanel title="Top 10 users" dataSource={topUsers.data_source}>
            {topUsers.data_source === "none" ? (
              <PopulationNonePlaceholder message="Sin datos de actividad" />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-cockpit-muted">
                  <tr>
                    <th className="py-1 text-left">Email</th>
                    <th className="py-1 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.data.items.map((u) => (
                    <tr key={u.user_id} className="border-t border-cockpit-border">
                      <td className="py-1 font-mono text-xs">{u.email}</td>
                      <td className="py-1 text-right font-mono tabular-nums">{u.activity_score.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </PopulationPanel>
        ) : null}
      </div>
    </div>
  );
}
