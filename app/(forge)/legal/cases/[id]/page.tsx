"use client";

import { use, useCallback } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { CaseActorsPanel } from "@/components/legal/cases/CaseActorsPanel";
import { CaseDeadlinesPanel } from "@/components/legal/cases/CaseDeadlinesPanel";
import { CaseActionsMenu } from "@/components/legal/cases/CaseActionsMenu";
import { deleteLock } from "@/lib/legal/cases/legal-cases-api";

export default function LegalCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error, refetch } = useLegalCase(effectiveTenantId, id);

  const onReleaseLock = useCallback(async () => {
    if (!effectiveTenantId) return;
    await deleteLock(effectiveTenantId, id);
    void refetch();
  }, [effectiveTenantId, id, refetch]);

  if (!tenantHydrated) return <p className="text-sm text-forgeInk-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }
  if (isLoading) return <p className="text-sm text-forgeInk-500">Cargando expediente…</p>;
  if (error || !c) {
    return <p className="text-sm text-forgeDanger-700">No se pudo cargar el expediente</p>;
  }

  return (
    <main id="main-content" className="min-h-0 space-y-8">
      <CaseDetailHeader legalCase={c} onReleaseLock={() => void onReleaseLock()} />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <CaseActorsPanel actors={c.actors} />
          <CaseDeadlinesPanel
            deadlines={c.deadlines}
            caseId={id}
            tenantId={effectiveTenantId}
            onOverridden={() => {
              void refetch();
            }}
          />
        </div>
        <div>
          <CaseActionsMenu tenantId={effectiveTenantId} caseId={id} />
        </div>
      </div>
    </main>
  );
}
