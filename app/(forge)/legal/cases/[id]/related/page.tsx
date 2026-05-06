"use client";

import { use } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useCaseRelated } from "@/hooks/legal/useCaseRelated";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { CaseRelatedCasesPanel } from "@/components/legal/cases/CaseRelatedCasesPanel";

export default function LegalCaseRelatedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error } = useLegalCase(effectiveTenantId, id);
  const { data: rel, isLoading: lr } = useCaseRelated(effectiveTenantId, id);

  if (!tenantHydrated) return <p className="text-sm text-forgeInk-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }
  if (isLoading || error || !c) {
    return <p className="text-sm text-forgeInk-500">{isLoading ? "Cargando…" : "Error"}</p>;
  }

  return (
    <main id="main-content" className="min-h-0 space-y-6">
      <CaseDetailHeader legalCase={c} />
      {lr ? <p className="text-sm text-forgeInk-500">Cargando relacionados…</p> : null}
      <CaseRelatedCasesPanel payload={rel} />
    </main>
  );
}
