"use client";

import { BankComplianceView } from "@/components/credit-hub/bank/BankComplianceView";
import { useBankGlobalCompliance } from "@/lib/credit-hub/hooks/useBankAuditCompliance";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

export default function BankCompliancePage() {
  const { tenantConfig } = useTenantConfig();
  // PR-FE-6: real compliance incidents aggregated from the per-application
  // /compliance/{id} endpoint across the tenant queue (no hardcoded issue rows).
  const compliance = useBankGlobalCompliance();

  return (
    <BankComplianceView
      issues={compliance.issues}
      jurisdictionCode={tenantConfig.country_code}
      institutionName={tenantConfig.institution_name}
      isLoading={compliance.isLoading}
      isError={compliance.isError}
      onRetry={compliance.refetch}
    />
  );
}
