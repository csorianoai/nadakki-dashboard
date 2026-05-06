"use client";

import { CaseCreateWizard } from "@/components/legal/cases/CaseCreateWizard";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";

export default function LegalCasesNewPage() {
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  if (!tenantHydrated) return <p className="text-sm text-forgeInk-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }
  return (
    <main id="main-content" className="min-h-0">
      <CaseCreateWizard tenantId={effectiveTenantId} />
    </main>
  );
}
