"use client";

import { useMemo } from "react";
import { BankDashboardView } from "@/components/credit-hub/bank/BankDashboardView";
import { useBankAnalytics } from "@/lib/credit-hub/hooks/useBankAnalytics";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { WelcomeGuide } from "@/components/credit-hub/onboarding/WelcomeGuide";

export default function BankDashboardPage() {
  const { tenantConfig } = useTenantConfig();
  const queueQuery = useBankQueue();
  const analyticsQuery = useBankAnalytics();
  const queue = queueQuery.data?.applications ?? [];

  const complianceSummary = useMemo(() => {
    const issues = queue.filter((q) => q.bank_decision && q.bank_decision.compliance_check?.ley_172_13_compliant === false).length;
    if (!queue.length) return undefined;
    const pct = (((queue.length - issues) / queue.length) * 100).toFixed(1);
    return `${pct}% en cumplimiento · ${issues} incidencias visibles en cola`;
  }, [queue]);

  return (
    <>
      <WelcomeGuide persona="bank" institutionName={tenantConfig.institution_name} />
      <BankDashboardView
        queue={queue}
        analytics={analyticsQuery.data}
        institutionName={tenantConfig.institution_name}
        complianceSummary={complianceSummary}
        isLoading={queueQuery.isLoading || analyticsQuery.isLoading}
        isError={!!queueQuery.error || !!analyticsQuery.error}
        onRetry={() => {
          void queueQuery.refetch();
          void analyticsQuery.refetch();
        }}
      />
    </>
  );
}
