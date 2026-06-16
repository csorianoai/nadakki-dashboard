"use client";

import { useMemo } from "react";
import { BankComplianceView } from "@/components/credit-hub/bank/BankComplianceView";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import type { BankComplianceIssueView } from "@/lib/credit-hub/types/bank-views";

export default function BankCompliancePage() {
  const { tenantConfig } = useTenantConfig();
  const queueQuery = useBankQueue({ limit: 100 });

  const issues = useMemo((): BankComplianceIssueView[] => {
    const apps = queueQuery.data?.applications ?? [];
    return apps
      .filter((a) => a.bank_decision?.compliance_check?.ley_172_13_compliant === false)
      .map((a, i) => ({
        id: `c-${a.application_id}-${i}`,
        rule: "LEY-172-13",
        severity: "media",
        description: "Validación de cumplimiento pendiente o incumplimiento detectado en decisión.",
        application_id: a.application_id,
      }));
  }, [queueQuery.data?.applications]);

  return (
    <BankComplianceView
      issues={issues}
      jurisdictionCode={tenantConfig.country_code}
      institutionName={tenantConfig.institution_name}
      isLoading={queueQuery.isLoading}
      isError={!!queueQuery.error}
      onRetry={() => void queueQuery.refetch()}
    />
  );
}
