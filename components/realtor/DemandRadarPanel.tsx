"use client";

import { useMemo, useState } from "react";
import { isDemoAllowed } from "@/lib/realtor/config";
import { DEMO_BANNER, FAIR_HOUSING_NOTE, INTRO } from "@/lib/realtor/copy";
import { buildDemoDataset, PILOT_FILTERS, pendingIntegrations, unavailableSignal } from "@/lib/realtor/demo-data";
import type { RadarFilters, RadarSignal } from "@/lib/realtor/types";
import { FiltersBar } from "./FiltersBar";
import { RealtorNotice } from "./RealtorNotice";
import { SignalCard } from "./SignalCard";
import { useRealtorAccess } from "./useRealtorAccess";

/** Hasta que exista el backend de señales, fuera de DEMO todo es UNAVAILABLE. */
function signalsFor(filters: RadarFilters, demoAllowed: boolean): RadarSignal[] {
  const base = demoAllowed
    ? buildDemoDataset(filters).signals
    : [unavailableSignal("radar", "Señales de demanda", "Demanda agregada", "Backend de señales (pendiente)")];
  return [...base, ...pendingIntegrations()];
}

export function DemandRadarPanel() {
  const access = useRealtorAccess();
  const [filters, setFilters] = useState<RadarFilters>(PILOT_FILTERS);
  const demoAllowed = isDemoAllowed();

  const signals = useMemo(() => signalsFor(filters, demoAllowed), [filters, demoAllowed]);

  if (access !== "ok") return <RealtorNotice reason={access} />;

  const showsDemo = signals.some((s) => s.status === "DEMO");
  return (
    <section data-testid="demand-radar-panel" className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Demand Radar AI</h1>
      <p className="text-sm">{INTRO}</p>
      {showsDemo ? <p role="note" data-testid="demo-banner" className="rounded border p-2 text-sm font-semibold">{DEMO_BANNER}</p> : null}
      <FiltersBar value={filters} onChange={setFilters} />
      <div className="grid gap-4 md:grid-cols-2">
        {signals.map((s) => (<SignalCard key={s.id} signal={s} />))}
      </div>
      <p role="note" className="text-xs">{FAIR_HOUSING_NOTE}</p>
    </section>
  );
}
