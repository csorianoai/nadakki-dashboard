"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { FinanceSubNav } from "@/components/cockpit/finance/FinanceSubNav";
import { CockpitErrorBoundary } from "@/lib/cockpit/components/ErrorBoundary";
import { EntityTypesRegistry } from "./EntityTypesRegistry";
import { ProfessionsRegistry } from "./ProfessionsRegistry";
import { RegistrySubNav, type RegistryTabId } from "./RegistrySubNav";

function parseTab(raw: string | null): RegistryTabId {
  return raw === "entity-types" ? "entity-types" : "professions";
}

function RegistryContent() {
  const tab = parseTab(useSearchParams().get("tab"));

  return (
    <>
      <RegistrySubNav />
      {tab === "professions" ? (
        <CockpitErrorBoundary title="Profesiones">
          <ProfessionsRegistry />
        </CockpitErrorBoundary>
      ) : (
        <CockpitErrorBoundary title="Tipos de entidad">
          <EntityTypesRegistry />
        </CockpitErrorBoundary>
      )}
    </>
  );
}

export function RegistryView() {
  return (
    <div className="space-y-6" data-testid="finance-registry-view">
      <header>
        <h1 className="text-2xl font-semibold text-cockpit-text">Finanzas</h1>
        <p className="text-sm text-cockpit-muted">Registro de profesiones y tipos de entidad</p>
      </header>
      <FinanceSubNav />
      <Suspense fallback={<p className="text-sm text-cockpit-muted">Cargando registro…</p>}>
        <RegistryContent />
      </Suspense>
    </div>
  );
}
