"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchPopulationByFamily } from "@/lib/cockpit/api/financePopulation";
import { DEMO_PROFESSION_FAMILIES } from "@/lib/cockpit/demo-population";
import { formatInteger } from "@/lib/cockpit/format";
import { useCockpit } from "@/lib/cockpit/context";

export function PopulationByFamily() {
  const { locale } = useCockpit();
  const [family, setFamily] = useState<string>(DEMO_PROFESSION_FAMILIES[0]);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPopulationByFamily>> | null>(null);

  const load = useCallback(async () => {
    setData(await fetchPopulationByFamily(family));
  }, [family]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-sm text-cockpit-muted">
          Familia
          <select
            className="ml-2 rounded border border-cockpit-border bg-cockpit-bg px-2 py-1 text-sm text-cockpit-text"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
          >
            {DEMO_PROFESSION_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        {data?.isDemo ? <DataTruthBadge level="DEMO" /> : null}
        <span className="font-cockpitMono text-sm tabular-nums">
          Total: {formatInteger(data?.data.total ?? 0, locale)}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-cockpit-muted">
          <tr>
            <th className="py-2 text-left">Tenant</th>
            <th className="py-2 text-left">País</th>
            <th className="py-2 text-right">Count</th>
          </tr>
        </thead>
        <tbody>
          {(data?.data.rows ?? []).map((r) => (
            <tr key={`${r.tenant_id}-${r.country_code}`} className="border-t border-cockpit-border">
              <td className="py-2">{r.tenant_name}</td>
              <td className="py-2">{r.country_code}</td>
              <td className="py-2 text-right font-cockpitMono tabular-nums">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
