"use client";

import { CaseCreateWizard } from "@/components/legal/cases/CaseCreateWizard";

/** Variante evaluación: mismo asistente con `initial_state` controlado dentro del wizard por modo. */
export function CaseCreateWizardEvaluacionMode({ tenantId }: { tenantId: string }) {
  return <CaseCreateWizard tenantId={tenantId} />;
}
