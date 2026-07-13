"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchPopulationByFamily } from "@/lib/cockpit/api/population";
import { POPULATION_FAMILIES } from "@/lib/cockpit/population-config";
import type { PopulationByFamilyEnvelope } from "@/lib/cockpit/finance-v3/contracts/population";
import { PopulationErrorBanner, PopulationNonePlaceholder, PopulationPanel } from "./PopulationPanel";

export function PopulationByFamilyTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const family = searchParams.get("family") ?? POPULATION_FAMILIES[0]?.value ?? "dealers";
  const [envelope, setEnvelope] = useState<PopulationByFamilyEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    const r = await fetchPopulationByFamily(f);
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
    void load(family);
  }, [family, load]);

  function onFamilyChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "by-family");
    params.set("family", next);
    router.replace(`/cockpit/finance/population?${params.toString()}`);
  }

  return (
    <div className="space-y-4" data-testid="population-tab-by-family">
      <select
        className="rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm"
        value={family}
        onChange={(e) => onFamilyChange(e.target.value)}
        data-testid="population-family-select"
      >
        {POPULATION_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      {error ? <PopulationErrorBanner message={error} /> : null}
      {loading ? (
        <p className="text-sm text-cockpit-muted">Cargando familia…</p>
      ) : envelope ? (
        <PopulationPanel title={`Familia: ${family}`} dataSource={envelope.data_source}>
          {envelope.data_source === "none" || envelope.data.rows.length === 0 ? (
            <PopulationNonePlaceholder message="Sin tenants para esta familia" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-cockpit-muted">
                <tr>
                  <th className="py-1 text-left">Tenant</th>
                  <th className="py-1 text-left">País</th>
                  <th className="py-1 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {envelope.data.rows.map((row) => (
                  <tr key={row.tenant_id} className="border-t border-cockpit-border">
                    <td className="py-1">{row.tenant_name}</td>
                    <td className="py-1 font-mono text-xs">{row.country_code}</td>
                    <td className="py-1 text-right font-mono tabular-nums">{row.count}</td>
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
