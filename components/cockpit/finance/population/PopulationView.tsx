"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CockpitErrorBoundary } from "@/lib/cockpit/components/ErrorBoundary";
import { longDateEsDO } from "@/lib/cockpit/format";
import { PopulationActivity } from "./PopulationActivity";
import { PopulationByCore } from "./PopulationByCore";
import { PopulationByCountry } from "./PopulationByCountry";
import { PopulationByEntityType } from "./PopulationByEntityType";
import { PopulationByFamily } from "./PopulationByFamily";
import { PopulationDigitalAgents } from "./PopulationDigitalAgents";
import { PopulationSubNav } from "./PopulationSubNav";
import { PopulationSummary } from "./PopulationSummary";

function PopulationContent() {
  const params = useSearchParams();
  const tab = params.get("tab") || "summary";

  return (
    <>
      <PopulationSubNav />
      {tab === "summary" ? (
        <CockpitErrorBoundary title="Resumen población">
          <PopulationSummary />
        </CockpitErrorBoundary>
      ) : null}
      {tab === "by-core" ? (
        <CockpitErrorBoundary title="Población por core">
          <PopulationByCore />
        </CockpitErrorBoundary>
      ) : null}
      {tab === "by-family" ? (
        <CockpitErrorBoundary title="Por familia">
          <PopulationByFamily />
        </CockpitErrorBoundary>
      ) : null}
      {tab === "by-entity" ? (
        <CockpitErrorBoundary title="Por entidad">
          <PopulationByEntityType />
        </CockpitErrorBoundary>
      ) : null}
      {tab === "by-country" ? (
        <CockpitErrorBoundary title="Por país">
          <PopulationByCountry />
        </CockpitErrorBoundary>
      ) : null}
      {tab === "digital-agents" ? (
        <CockpitErrorBoundary title="Agentes digitales">
          <PopulationDigitalAgents />
        </CockpitErrorBoundary>
      ) : null}
      {tab === "activity" ? (
        <CockpitErrorBoundary title="Actividad">
          <PopulationActivity />
        </CockpitErrorBoundary>
      ) : null}
    </>
  );
}

export function PopulationView() {
  return (
    <div className="space-y-4" data-testid="finance-population-view">
      <header>
        <h1 className="text-[32px] font-semibold">Población</h1>
        <p className="mt-1 text-cockpit-muted">
          Profesionales, entidades y actividad cross-tenant · {longDateEsDO()}
        </p>
      </header>
      <Suspense fallback={<p className="text-cockpit-muted">Cargando…</p>}>
        <PopulationContent />
      </Suspense>
    </div>
  );
}
