"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FinanceSubNav } from "@/components/cockpit/finance/FinanceSubNav";
import {
  POPULATION_TAB_IDS,
  POPULATION_TAB_LABELS,
  type PopulationTabId,
} from "@/lib/cockpit/population-config";
import { PopulationSummaryTab } from "./PopulationSummaryTab";
import { PopulationByCoreTab } from "./PopulationByCoreTab";
import { PopulationByFamilyTab } from "./PopulationByFamilyTab";
import { PopulationByEntityTab } from "./PopulationByEntityTab";
import { PopulationByCountryTab } from "./PopulationByCountryTab";
import { PopulationDigitalAgentsTab } from "./PopulationDigitalAgentsTab";
import { PopulationActivityTab } from "./PopulationActivityTab";

function parseTab(raw: string | null): PopulationTabId {
  if (raw && POPULATION_TAB_IDS.includes(raw as PopulationTabId)) {
    return raw as PopulationTabId;
  }
  return "summary";
}

function PopulationTabsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const setTab = useCallback(
    (tab: PopulationTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/cockpit/finance/population?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-cockpit-text">Finanzas</h1>
        <p className="text-sm text-cockpit-muted">Población de la red</p>
      </header>
      <FinanceSubNav />
      <nav className="flex flex-wrap gap-1 border-b border-cockpit-border pb-2" data-testid="population-tab-nav">
        {POPULATION_TAB_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
              activeTab === id
                ? "bg-cockpit-accent/15 text-cockpit-text"
                : "text-cockpit-muted hover:bg-cockpit-border/40"
            }`}
          >
            {POPULATION_TAB_LABELS[id]}
          </button>
        ))}
      </nav>
      {activeTab === "summary" ? <PopulationSummaryTab /> : null}
      {activeTab === "by-core" ? <PopulationByCoreTab /> : null}
      {activeTab === "by-family" ? <PopulationByFamilyTab /> : null}
      {activeTab === "by-entity" ? <PopulationByEntityTab /> : null}
      {activeTab === "by-country" ? <PopulationByCountryTab /> : null}
      {activeTab === "digital-agents" ? <PopulationDigitalAgentsTab /> : null}
      {activeTab === "activity" ? <PopulationActivityTab /> : null}
    </div>
  );
}

export function PopulationView() {
  return (
    <Suspense fallback={<p className="text-sm text-cockpit-muted">Cargando población…</p>}>
      <PopulationTabsInner />
    </Suspense>
  );
}
