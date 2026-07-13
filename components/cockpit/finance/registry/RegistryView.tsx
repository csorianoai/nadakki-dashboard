"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CockpitErrorBoundary } from "@/lib/cockpit/components/ErrorBoundary";
import { EntityTypesRegistry } from "./EntityTypesRegistry";
import { ProfessionsRegistry } from "./ProfessionsRegistry";
import { RegistrySubNav } from "./RegistrySubNav";

function RegistryContent() {
  const tab = useSearchParams().get("tab") || "professions";
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
    <div data-testid="finance-registry-view">
      <header className="mb-4">
        <h1 className="text-[32px] font-semibold">Registro</h1>
        <p className="mt-1 text-cockpit-muted">Profesiones y tipos de entidad — config-driven</p>
      </header>
      <Suspense fallback={<p className="text-cockpit-muted">Cargando…</p>}>
        <RegistryContent />
      </Suspense>
    </div>
  );
}
