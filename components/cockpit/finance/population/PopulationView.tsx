"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CockpitErrorBoundary } from "@/lib/cockpit/components/ErrorBoundary";
import { longDateEsDO } from "@/lib/cockpit/format";
import { PopulationByCore } from "./PopulationByCore";
import { PopulationPendingPanel, PopulationSubNav } from "./PopulationSubNav";
import { PopulationSummary } from "./PopulationSummary";

function PopulationContent() {
  const params = useSearchParams();
  const tab = params.get("tab") || "summary";

  return (
    <>
      <PopulationSubNav activeOnly={["summary", "by-core"]} />
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
      {tab !== "summary" && tab !== "by-core" ? (
        <PopulationPendingPanel label="Sub-vista en construcción" />
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
