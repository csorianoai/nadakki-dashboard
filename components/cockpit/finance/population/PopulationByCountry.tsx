"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchPopulationByCountry } from "@/lib/cockpit/api/financePopulation";
import { formatInteger } from "@/lib/cockpit/format";
import { useCockpit } from "@/lib/cockpit/context";

export function PopulationByCountry() {
  const { locale } = useCockpit();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPopulationByCountry>> | null>(null);

  const load = useCallback(async () => {
    setData(await fetchPopulationByCountry());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold">Distribución por país</h2>
        {data?.isDemo ? <DataTruthBadge level="DEMO" /> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(data?.data.countries ?? []).map((c) => (
          <div key={c.country_code} className="rounded-lg border border-cockpit-border p-4">
            <p className="font-semibold">{c.country_name}</p>
            <p className="mt-2 text-sm text-cockpit-muted">
              Tenants:{" "}
              <span className="font-cockpitMono tabular-nums text-cockpit-text">
                {formatInteger(c.tenants_count, locale)}
              </span>
            </p>
            <p className="text-sm text-cockpit-muted">
              Usuarios:{" "}
              <span className="font-cockpitMono tabular-nums text-cockpit-text">
                {formatInteger(c.users_count, locale)}
              </span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
