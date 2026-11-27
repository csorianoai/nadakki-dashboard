"use client";

import { use, useState } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useCaseStrategies } from "@/hooks/legal/useCaseStrategies";
import { useCaseActions } from "@/hooks/legal/useCaseActions";
import { useQueryClient } from "@tanstack/react-query";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { CaseStrategyMultiSelect } from "@/components/legal/cases/CaseStrategyMultiSelect";
import type { CaseStrategy } from "@/lib/legal/cases/case-types";
import { mensajeErrorEstrategias as mensajeError } from "@/lib/legal/cases/mensaje-estrategias";

export default function LegalCaseStrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error, refetch } = useLegalCase(effectiveTenantId, id);
  const { data: st, isLoading: ls, error: strategyError, selectStrategies, selecting } = useCaseStrategies(effectiveTenantId, id);
  const [selected, setSelected] = useState<string[]>([]);
  // QA 23-nov: la pestaña no tenía cómo generar estrategias; el botón estaba solo en el Resumen.
  const { runAction, runTransition, running } = useCaseActions(effectiveTenantId, id);
  const qc = useQueryClient();
  const [aviso, setAviso] = useState<string | null>(null);
  const generar = async () => {
    setAviso(null);
    try {
      // Validación 27-nov-2026: un expediente recién creado queda en «Ingreso de documentos» y el backend no genera
      // estrategias en ese estado (409 en inglés). Se pasa primero a «Análisis automático», con el motivo en la línea de tiempo.
      if (c?.state === "INGESTION") {
        await runTransition({ newState: "TRIAGE", reason: "Paso a análisis para generar estrategias" });
      }
      const r = (await runAction({ actionName: "generate_strategies", payload: {} })) as
        | { count?: number; strategies?: unknown[]; mensaje?: string; motivo?: string }
        | null
        | undefined;
      const n = typeof r?.count === "number" ? r.count : Array.isArray(r?.strategies) ? r.strategies.length : null;
      if (n === null || n === 0) setAviso(r?.mensaje || r?.motivo || "No se generaron estrategias.");
      await qc.invalidateQueries({ queryKey: ["legal_case_strategies", effectiveTenantId ?? "", id] });
    } catch (e: unknown) {
      setAviso(mensajeError(e));
    }
  };

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
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void generar()}
          disabled={running}
          className="inline-flex rounded-forge-sm bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-forgeGray-50 hover:bg-forgeBrand-700 disabled:opacity-50"
        >
          {running ? "Generando estrategias…" : strategies.length ? "Volver a generar estrategias" : "Generar estrategias"}
        </button>
        <span className="text-xs text-forgeGray-600">
          {running ? "Puede tardar hasta un minuto." : "Se proponen para el cliente del despacho; requieren revisión del abogado."}
        </span>
      </div>
      {aviso ? <p role="status" className="text-sm text-amber-700">{aviso}</p> : null}
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
