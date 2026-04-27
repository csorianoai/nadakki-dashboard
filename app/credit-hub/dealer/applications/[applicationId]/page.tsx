"use client";

import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { ForgePageHeader } from "@/components/credit-hub/system/ForgePageHeader";

export default function DealerApplicationDetailPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <ForgePageHeader title="Detalle de solicitud" subtitle="Información de la solicitud" />

      <ForgeCard className="p-12 text-center">
        <p className="text-forge-text-muted">Detail coming in Sesión 2</p>
      </ForgeCard>
    </div>
  );
}
