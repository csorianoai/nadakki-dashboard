"use client";

import { DealerWizardCoBorrowerStep } from "./DealerWizardCoBorrowerStep";
import { DealerWizardDocumentsStep } from "./DealerWizardDocumentsStep";

export function DealerWizardReviewStep() {
  return (
    <div className="space-y-10" data-testid="wizard-review-step">
      <div>
        <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">Revisión y despacho</h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">
          Revisa la información, completa los documentos y despacha solo después de confirmar el consentimiento.
        </p>
      </div>
      <DealerWizardCoBorrowerStep />
      <DealerWizardDocumentsStep />
    </div>
  );
}
