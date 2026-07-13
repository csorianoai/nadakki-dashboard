"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPopulationByEntity } from "@/lib/cockpit/api/population";
import type { PopulationByEntityEnvelope } from "@/lib/cockpit/finance-v3/contracts/population";
import { PopulationErrorBanner, PopulationNonePlaceholder, PopulationPanel } from "./PopulationPanel";

export function PopulationByEntityTab() {
  const [envelope, setEnvelope] = useState<PopulationByEntityEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<PopulationByEntityEnvelope["data"]["types"][0] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchPopulationByEntity();
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

  if (loading) return <p className="text-sm text-cockpit-muted">Cargando entidades…</p>;

  return (
    <div className="space-y-4" data-testid="population-tab-by-entity">
      {error ? <PopulationErrorBanner message={error} /> : null}
      {envelope ? (
        <PopulationPanel title="Tipos de institución" dataSource={envelope.data_source}>
          {envelope.data_source === "none" || envelope.data.types.length === 0 ? (
            <PopulationNonePlaceholder message="Sin tipos de entidad" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {envelope.data.types.map((t) => (
                <button
                  key={`${t.core_name}-${t.entity_code}`}
                  type="button"
                  className="rounded-lg border border-cockpit-border p-3 text-left transition-colors hover:border-cockpit-accent"
                  onClick={() => setDrawer(t)}
                >
                  <p className="text-sm font-medium">{t.display_name}</p>
                  <p className="text-xs text-cockpit-muted">{t.core_name}</p>
                  <p className="mt-1 font-mono text-lg tabular-nums">{t.count}</p>
                </button>
              ))}
            </div>
          )}
        </PopulationPanel>
      ) : null}
      {drawer ? (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-black/50" aria-label="Cerrar" onClick={() => setDrawer(null)} />
          <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-cockpit-border bg-cockpit-surface p-4">
            <h3 className="text-lg font-semibold">{drawer.display_name}</h3>
            <p className="text-sm text-cockpit-muted">{drawer.entity_code} · {drawer.core_name}</p>
            <p className="mt-4 font-mono text-2xl tabular-nums">{drawer.count} tenants</p>
          </aside>
        </>
      ) : null}
    </div>
  );
}
