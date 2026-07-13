"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPopulationDigitalAgents } from "@/lib/cockpit/api/population";
import type { DigitalAgentsEnvelope } from "@/lib/cockpit/finance-v3/contracts/population";
import { formatCockpitInteger } from "@/lib/cockpit/finance-v3/format";
import { PopulationErrorBanner, PopulationNonePlaceholder, PopulationPanel } from "./PopulationPanel";

export function PopulationDigitalAgentsTab() {
  const [envelope, setEnvelope] = useState<DigitalAgentsEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchPopulationDigitalAgents();
    if (r.status === "ok") {
      setEnvelope(r.envelope);
      setError(null);
    } else {
      setEnvelope(null);
      setError(r.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-cockpit-muted">Cargando agentes…</p>;

  return (
    <div className="space-y-4" data-testid="population-tab-digital-agents">
      <header>
        <h2 className="text-lg font-semibold">Nauta — Fuerza laboral digital</h2>
      </header>
      {error ? <PopulationErrorBanner message={error} /> : null}
      {envelope ? (
        <PopulationPanel title="Agentes por tenant" dataSource={envelope.data_source}>
          {envelope.data_source === "none" ? (
            <PopulationNonePlaceholder message="Telemetría de agentes no disponible — datos en cero en producción" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-cockpit-muted">
                <tr>
                  <th className="py-1 text-left">Tenant</th>
                  <th className="py-1 text-right">Activos</th>
                  <th className="py-1 text-right">Runs</th>
                </tr>
              </thead>
              <tbody>
                {envelope.data.agents.map((a) => (
                  <tr key={a.tenant_id} className="border-t border-cockpit-border">
                    <td className="py-1 font-mono text-xs">{a.tenant_id.slice(0, 8)}…</td>
                    <td className="py-1 text-right tabular-nums">{formatCockpitInteger(a.active_agents)}</td>
                    <td className="py-1 text-right tabular-nums">{formatCockpitInteger(a.total_runs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </PopulationPanel>
      ) : null}
    </div>
  );
}
