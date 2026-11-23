"use client";

import { use, useEffect, useState } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { CaseDeadlinesPanel } from "@/components/legal/cases/CaseDeadlinesPanel";
import { CaseDeadlinesCalculator } from "@/components/legal/cases/CaseDeadlinesCalculator";

export default function LegalCaseDeadlinesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Desde «Subir documento»: ?doc=<id>&fecha=<notificación> deja el formulario listo.
  // (Se lee en el cliente: useSearchParams exige un Suspense en el build.)
  const [sp, setSp] = useState<URLSearchParams>(() => new URLSearchParams());
  useEffect(() => setSp(new URLSearchParams(window.location.search)), []);
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error, refetch } = useLegalCase(effectiveTenantId, id);

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
      <CaseDeadlinesPanel
        deadlines={c.deadlines}
        caseId={id}
        tenantId={effectiveTenantId}
        onOverridden={() => void refetch()}
      />
      <CaseDeadlinesCalculator
        tenantId={effectiveTenantId}
        caseId={id}
        documents={c.documents ?? []}
        docInicial={sp.get("doc")}
        fechaInicial={sp.get("fecha")}
        onSaved={() => void refetch()}
      />
    </main>
  );
}
