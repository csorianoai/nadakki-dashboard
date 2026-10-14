"use client";

import { useMemo, useState } from "react";
import { isDemoAllowed } from "@/lib/realtor/config";
import { DEMO_BANNER, FAIR_HOUSING_NOTE, INTRO } from "@/lib/realtor/copy";
import { buildDemoDataset, PILOT_FILTERS, pendingIntegrations, TABS, unavailableTabs, type TabId } from "@/lib/realtor/demo-data";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import type { RadarFilters, RadarSignal } from "@/lib/realtor/types";
import { FiltersBar } from "./FiltersBar";
import { RealtorNotice } from "./RealtorNotice";
import { SignalCard } from "./SignalCard";
import { SignalDetail } from "./SignalDetail";
import { useRealtorAccess } from "./useRealtorAccess";

/** Hasta que exista el backend de señales, fuera de DEMO todo es UNAVAILABLE. */
function signalsFor(filters: RadarFilters, demoAllowed: boolean): RadarSignal[] {
  return demoAllowed ? buildDemoDataset(filters).signals : unavailableTabs();
}

export function DemandRadarPanel() {
  const access = useRealtorAccess();
  const [filters, setFilters] = useState<RadarFilters>(PILOT_FILTERS);
  const [tab, setTab] = useState<TabId>("intencion");
  const demoAllowed = isDemoAllowed();

  const signals = useMemo(() => signalsFor(filters, demoAllowed), [filters, demoAllowed]);
  const pending = useMemo(() => pendingIntegrations(), []);

  if (access !== "ok") return <RealtorNotice reason={access} />;

  const active = signals.find((s) => s.id === tab) ?? signals[0];
  const showsDemo = signals.some((s) => s.status === "DEMO");
  return (
    <section data-testid="demand-radar-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: 1.15 }}>Demand Radar AI</h1>
        <p style={{ margin: "14px 0 0", maxWidth: 780, fontSize: 16, lineHeight: 1.45, color: RT.muted }}>{INTRO}</p>
      </div>
      {showsDemo ? (
        <p role="note" data-testid="demo-banner" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{DEMO_BANNER}</p>
      ) : null}
      <FiltersBar value={filters} onChange={setFilters} />
      <nav aria-label="Lugar" data-testid="place-crumb" style={{ fontSize: 14, color: RT.muted }}>
        {[filters.country, filters.region, filters.city, filters.zone].join(" › ")}
      </nav>
      <div role="group" aria-label="Tipo de señal" data-testid="signal-tabs" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} type="button" data-testid={`tab-${t.id}`} aria-pressed={on} onClick={() => setTab(t.id)}
              style={{ minHeight: 44, padding: "0 22px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700,
                border: `1px solid ${on ? RT.ink : RT.lineStrong}`, background: on ? RT.ink : RT.white, color: on ? RT.white : RT.ink }}>
              {t.label}
            </button>
          );
        })}
      </div>
      <SignalDetail signal={active} operation={filters.operation} />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {pending.map((s) => (<SignalCard key={s.id} signal={s} />))}
      </div>
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{FAIR_HOUSING_NOTE}</p>
    </section>
  );
}
