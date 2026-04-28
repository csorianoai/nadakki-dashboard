"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const WizardContainer = dynamic(
  () => import("@/components/credit-hub/dealer/wizard/WizardContainer").then((mod) => mod.WizardContainer),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse rounded-2xl bg-forge-surface" />,
  }
);

export default function NewDealerApplicationPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-forge-text">Nueva Solicitud</h1>
        <p className="mt-1 text-forge-text-muted">Completa los datos del cliente y vehículo.</p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-forge-surface" />}>
        <WizardContainer />
      </Suspense>
    </div>
  );
}
