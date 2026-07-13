"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPopulationByCountry } from "@/lib/cockpit/api/population";
import type { PopulationByCountryEnvelope } from "@/lib/cockpit/finance-v3/contracts/population";
import { formatCockpitInteger } from "@/lib/cockpit/finance-v3/format";
import { PopulationErrorBanner, PopulationNonePlaceholder, PopulationPanel } from "./PopulationPanel";

export function PopulationByCountryTab() {
  const [envelope, setEnvelope] = useState<PopulationByCountryEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchPopulationByCountry();
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

  if (loading) return <p className="text-sm text-cockpit-muted">Cargando por país…</p>;

  return (
    <div className="space-y-4" data-testid="population-tab-by-country">
      {error ? <PopulationErrorBanner message={error} /> : null}
      {envelope ? (
        <PopulationPanel title="Distribución por país" dataSource={envelope.data_source}>
          {envelope.data_source === "none" || envelope.data.countries.length === 0 ? (
            <PopulationNonePlaceholder message="Sin datos por país" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {envelope.data.countries.map((c) => (
                <div key={c.country_code} className="rounded-lg border border-cockpit-border p-4">
                  <p className="text-lg font-semibold">{c.country_code}</p>
                  <p className="text-xs text-cockpit-muted">
                    {formatCockpitInteger(c.tenant_count)} tenants · {formatCockpitInteger(c.user_count)} users
                  </p>
                </div>
              ))}
            </div>
          )}
        </PopulationPanel>
      ) : null}
    </div>
  );
}
