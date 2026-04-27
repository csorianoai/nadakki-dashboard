"use client";

import { WizardContainer } from "@/components/credit-hub/dealer/wizard/WizardContainer";

export default function NewDealerApplicationPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-forge-text">Nueva Solicitud</h1>
        <p className="mt-1 text-forge-text-muted">Completa los datos del cliente y vehículo.</p>
      </div>

      <WizardContainer />
    </div>
  );
}
