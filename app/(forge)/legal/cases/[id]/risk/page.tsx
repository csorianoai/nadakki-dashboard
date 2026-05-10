"use client";

import { use } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useCaseRisk } from "@/hooks/legal/useCaseRisk";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export default function LegalCaseRiskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const m = useLegalCasesMessages();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error } = useLegalCase(effectiveTenantId, id);
  const { data: risk, isLoading: lr } = useCaseRisk(effectiveTenantId, id);
  const profile = risk ?? c?.risk_profile;

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
      {lr ? <p className="text-sm text-forgeGray-500">Cargando riesgo…</p> : null}
      {!profile ? (
        <p className="text-sm text-forgeGray-500">{m.risk.empty}</p>
      ) : (
        <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-4 text-sm space-y-2">
          <h2 className="font-semibold text-forgeGray-900">{m.risk.title}</h2>
          <p>
            {m.risk.overall_score}: {Math.round(profile.overall_risk_score * 100)}%
          </p>
          <p>
            {m.risk.probability_of_loss}: {Math.round(profile.probability_of_loss * 100)}%
          </p>
          <p>
            {m.risk.legal_complexity}: {profile.legal_complexity}
          </p>
          <p>
            {m.risk.timeline_risk}: {profile.timeline_risk}
          </p>
          {profile.financial_exposure ? (
            <p>
              {m.risk.financial_exposure}: {profile.financial_exposure}
            </p>
          ) : null}
        </div>
      )}
    </main>
  );
}
