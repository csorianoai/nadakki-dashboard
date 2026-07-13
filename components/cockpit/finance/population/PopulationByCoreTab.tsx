"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchPopulationByCore } from "@/lib/cockpit/api/population";
import { POPULATION_API_CORES } from "@/lib/cockpit/population-config";
import type { PopulationByCoreEnvelope } from "@/lib/cockpit/finance-v3/contracts/population";
import { formatCockpitInteger } from "@/lib/cockpit/finance-v3/format";
import { PopulationErrorBanner, PopulationNonePlaceholder, PopulationPanel } from "./PopulationPanel";

type CoreResult = {
  core: (typeof POPULATION_API_CORES)[number];
  envelope: PopulationByCoreEnvelope | null;
  error: string | null;
};

export function PopulationByCoreTab() {
  const [cores, setCores] = useState<CoreResult[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const settled = await Promise.allSettled(
      POPULATION_API_CORES.map((core) => fetchPopulationByCore(core.apiName)),
    );
    setCores(
      POPULATION_API_CORES.map((core, i) => {
        const r = settled[i];
        if (r?.status === "fulfilled" && r.value.status === "ok") {
          return { core, envelope: r.value.envelope, error: null };
        }
        const err =
          r?.status === "rejected"
            ? String(r.reason)
            : r?.status === "fulfilled" && r.value.status === "error"
              ? r.value.error
              : "Error";
        return { core, envelope: null, error: err };
      }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-cockpit-muted">Cargando por core…</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="population-tab-by-core">
      {cores.map(({ core, envelope, error }) => {
        if (error && !envelope) {
          return <PopulationErrorBanner key={core.apiName} message={`${core.label}: ${error}`} />;
        }
        if (!envelope) return null;
        const tenantCount = envelope.data.professions.reduce((s, p) => s + p.count, 0);
        const empty = envelope.data_source === "none" || envelope.data.professions.length === 0;
        return (
          <PopulationPanel key={core.apiName} title={core.label} dataSource={envelope.data_source}>
            <div
              className="mb-3 inline-flex rounded px-2 py-1 text-xs font-bold text-white"
              style={{ background: core.color }}
            >
              {core.chipCode}
            </div>
            {empty ? (
              <div className="space-y-2">
                <PopulationNonePlaceholder message="Sin profesiones registradas" />
                <Link
                  href="/cockpit/finance/registry"
                  className="text-xs text-cockpit-accent hover:underline"
                >
                  Ir al Registro →
                </Link>
              </div>
            ) : (
              <ul className="space-y-1 text-sm">
                {envelope.data.professions.map((p) => (
                  <li key={p.role_code} className="flex justify-between gap-2">
                    <span>{p.display_name}</span>
                    <span className="font-mono tabular-nums text-cockpit-muted">{p.count}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-cockpit-muted">
              en {formatCockpitInteger(tenantCount)} asignaciones
            </p>
          </PopulationPanel>
        );
      })}
    </div>
  );
}
