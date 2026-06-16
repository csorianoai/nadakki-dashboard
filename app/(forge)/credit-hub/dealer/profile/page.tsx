"use client";

import { DealerProfileView } from "@/components/credit-hub/dealer/DealerProfileView";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

export default function DealerProfilePage() {
  const { tenantConfig } = useTenantConfig();

  return (
    <DealerProfileView
      institutionName={tenantConfig.institution_name}
      locale={tenantConfig.locale}
      roleLabel="Asesor de piso"
    />
  );
}
