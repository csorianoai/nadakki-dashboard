"use client";

import { useAuth } from "@/contexts/AuthContext";
import { DealerDashboardView } from "@/components/credit-hub/dealer/DealerDashboardView";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { useCreditStats } from "@/lib/credit-hub/hooks/useCreditStats";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

export default function DealerDashboardPage() {
  const { tenantName } = useAuth();
  const { tenantConfig } = useTenantConfig();
  const applicationsQuery = useCreditApplications();
  const statsQuery = useCreditStats();

  return (
    <DealerDashboardView
      applications={applicationsQuery.data ?? []}
      stats={statsQuery.data}
      institutionName={tenantConfig.institution_name}
      userName={tenantName !== "—" ? tenantName : undefined}
      locale={tenantConfig.locale}
      currency={tenantConfig.currency_code}
      isLoading={applicationsQuery.isLoading || statsQuery.isLoading}
      isError={!!applicationsQuery.error || !!statsQuery.error}
      onRetry={() => {
        void applicationsQuery.refetch();
        void statsQuery.refetch();
      }}
    />
  );
}
