"use client";

import { use, useState } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useCaseStrategies } from "@/hooks/legal/useCaseStrategies";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { CaseStrategyMultiSelect } from "@/components/legal/cases/CaseStrategyMultiSelect";
import type { CaseStrategy } from "@/lib/legal/cases/case-types";

export default function LegalCaseStrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error, refetch } = useLegalCase(effectiveTenantId, id);
  const { data: st, isLoading: ls, error: strategyError, selectStrategies, selecting } = useCaseStrategies(effectiveTenantId, id);
  const [selected, setSelected] = useState<string[]>([]);

  const strategies: CaseStrategy[] = st?.strategies ?? c?.strategies ?? [];

  if (!tenantHydrated) return <p className="text-sm text-forgeGray-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }
  if (isLoading || error || !c) {
    return <p className="text-sm text-forgeGray-500">{isLoading ? "Cargando…" : "Error"}</p>;
  }

  return (
    <main id="main-content" className="min-h-0 space-y-6">
      <CaseDetailHeader legalCase={c} />
      {ls ? <p className="text-sm text-forgeGray-500">Cargando estrategias…</p> : null}
      {!ls && strategyError ? <p role="status" className="text-sm text-amber-700">{String((strategyError as Error).message).includes("503") ? "El modelo no está disponible. Intenta más tarde." : "La generación de estrategias aún no está disponible."}</p> : null}
      <CaseStrategyMultiSelect
        strategies={strategies}
        selectedIds={selected}
        onChange={setSelected}
        busy={selecting}
        emptyMessage={strategyError ? "No se pudieron cargar estrategias." : "No hay estrategias generadas para este expediente."}
        onSubmit={async () => {
          await selectStrategies({ strategy_ids: selected, generate_documents_immediately: true });
          void refetch();
        }}
      />
    </main>
  );
}
