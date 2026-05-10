"use client";

import { use } from "react";
import { useCaseTimeline } from "@/hooks/legal/useCaseTimeline";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { CaseTimeline } from "@/components/legal/cases/CaseTimeline";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export default function LegalCaseTimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const m = useLegalCasesMessages();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading: loadingCase, error: errCase } = useLegalCase(effectiveTenantId, id);
  const { data: tl, isLoading: loadingTl, error: errTl } = useCaseTimeline(effectiveTenantId, id);

  if (!tenantHydrated) return <p className="text-sm text-forgeGray-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }
  if (loadingCase || errCase || !c) {
    return <p className="text-sm text-forgeGray-500">{loadingCase ? "Cargando…" : "Error"}</p>;
  }

  return (
    <main id="main-content" className="min-h-0 space-y-6">
      <CaseDetailHeader legalCase={c} />
      <section aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="mb-4 text-lg font-semibold text-forgeGray-900">
          {m.timeline.title}
        </h2>
        {loadingTl ? <p className="text-sm text-forgeGray-500">Cargando eventos…</p> : null}
        {errTl ? <p className="text-sm text-forgeDanger-700">No se pudo cargar la línea de tiempo</p> : null}
        {tl ? <CaseTimeline events={tl.events} /> : null}
      </section>
    </main>
  );
}
