"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchPopulationByEntityType } from "@/lib/cockpit/api/financePopulation";
import { formatInteger } from "@/lib/cockpit/format";
import { useCockpit } from "@/lib/cockpit/context";

export function PopulationByEntityType() {
  const { locale } = useCockpit();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPopulationByEntityType>> | null>(null);
  const [drawer, setDrawer] = useState<{ title: string; tenants: string[] } | null>(null);

  const load = useCallback(async () => {
    setData(await fetchPopulationByEntityType());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold">Tipos de entidad conectada</h2>
          {data?.isDemo ? <DataTruthBadge level="DEMO" /> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.data.types ?? []).map((t) => (
            <button
              key={t.entity_code}
              type="button"
              className="rounded-lg border border-cockpit-border p-4 text-left hover:border-cockpit-accent/50"
              onClick={() =>
                setDrawer({
                  title: t.display_name,
                  tenants: t.tenant_ids ?? [],
                })
              }
            >
              <p className="font-medium">{t.display_name}</p>
              <p className="mt-1 font-cockpitMono text-2xl tabular-nums">{formatInteger(t.count, locale)}</p>
              <p className="mt-1 text-xs text-cockpit-accent">Ver tenants →</p>
            </button>
          ))}
        </div>
      </section>
      {drawer ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <aside className="h-full w-80 border-l border-cockpit-border bg-cockpit-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{drawer.title}</h3>
              <button type="button" className="text-sm text-cockpit-muted" onClick={() => setDrawer(null)}>
                Cerrar
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              {drawer.tenants.length ? (
                drawer.tenants.map((id) => (
                  <li key={id} className="rounded border border-cockpit-border px-2 py-1 font-mono text-xs">
                    {id}
                  </li>
                ))
              ) : (
                <li className="text-cockpit-muted">Sin tenants listados en esta vista.</li>
              )}
            </ul>
          </aside>
        </div>
      ) : null}
    </>
  );
}
