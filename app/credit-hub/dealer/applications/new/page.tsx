"use client";

import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { ForgePageHeader } from "@/components/credit-hub/system/ForgePageHeader";

export default function NewDealerApplicationPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <ForgePageHeader title="Nueva solicitud" subtitle="Captura de solicitud de crédito" />

      <ForgeCard className="p-12 text-center">
        <p className="text-forge-text-muted">Wizard coming in Sesión 2</p>
      </ForgeCard>
    </div>
  );
}
