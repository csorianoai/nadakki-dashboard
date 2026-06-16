"use client";

import { DealerApplicationsListView } from "@/components/credit-hub/dealer/DealerApplicationsListView";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

export default function DealerApplicationsPage() {
  const { tenantConfig } = useTenantConfig();
  const applicationsQuery = useCreditApplications();

  return (
    <DealerApplicationsListView
      applications={applicationsQuery.data ?? []}
      currency={tenantConfig.currency_code}
      isLoading={applicationsQuery.isLoading}
      isError={!!applicationsQuery.error}
      onRetry={() => void applicationsQuery.refetch()}
    />
  );
}
