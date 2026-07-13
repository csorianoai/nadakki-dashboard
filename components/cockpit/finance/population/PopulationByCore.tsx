"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchAllPopulationByCore } from "@/lib/cockpit/api/financePopulation";
import { fetchCoresSummary } from "@/lib/cockpit/api/observability";
import {
  CORE_COLOR_FALLBACK,
  CORE_DISPLAY_FALLBACK,
  CORE_INITIALS,
  PLATFORM_CORE_ORDER,
  type PlatformCoreCode,
} from "@/lib/cockpit/core-registry";
import { coreCode } from "@/lib/cockpit/normalize";
import type { PopulationByCoreResponse } from "@/lib/cockpit/types-finance";
import { RegistryLinkHint } from "./PopulationSubNav";

export function PopulationByCore() {
  const [cores, setCores] = useState<PopulationByCoreResponse[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  const load = useCallback(async () => {
    let codes: string[] = [...PLATFORM_CORE_ORDER];
    try {
      const reg = await fetchCoresSummary();
      const fromApi = (reg.data.cores ?? []).map((c) => coreCode(c)).filter(Boolean) as string[];
      if (fromApi.length) codes = [...new Set([...PLATFORM_CORE_ORDER, ...fromApi])];
    } catch {
      /* keep default six */
    }
    const r = await fetchAllPopulationByCore(codes);
    setCores(r.cores);
    setIsDemo(r.isDemo);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cores.map((c) => (
          <CorePopulationCard key={c.core_code} data={c} isDemo={isDemo} />
        ))}
      </div>
    </div>
  );
}

function CorePopulationCard({ data, isDemo }: { data: PopulationByCoreResponse; isDemo: boolean }) {
  const code = data.core_code as PlatformCoreCode;
  const color = CORE_COLOR_FALLBACK[code] ?? "#a78bfa";
  const initials = CORE_INITIALS[code] ?? data.core_code.slice(0, 2).toUpperCase();
  const name = data.display_name ?? CORE_DISPLAY_FALLBACK[code] ?? data.core_code;
  const professions = data.professions ?? [];

  return (
    <article
      className="rounded-xl border border-cockpit-border bg-cockpit-surface p-5"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded text-xs font-bold text-white"
            style={{ background: `${color}33`, color }}
          >
            {initials}
          </span>
          <h3 className="font-semibold">{name}</h3>
        </div>
        {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      </header>
      {professions.length ? (
        <ul className="space-y-1 text-sm text-cockpit-muted">
          {professions.map((p) => (
            <li key={p.role_code}>
              <span className="font-cockpitMono tabular-nums text-cockpit-text">{p.count}</span> {p.display_name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cockpit-muted">
          Sin profesiones registradas. <RegistryLinkHint />
        </p>
      )}
      <footer className="mt-3 text-xs text-cockpit-muted">
        en {data.tenants_connected ?? 0} tenants conectados
      </footer>
    </article>
  );
}
