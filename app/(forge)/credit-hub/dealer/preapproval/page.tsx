"use client";

import { PreApprovalView } from "@/components/credit-hub/dealer/preapproval/PreApprovalView";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

export default function DealerPreapprovalPage() {
  const { tenantConfig } = useTenantConfig();

  return <PreApprovalView locale={tenantConfig.locale} currency={tenantConfig.currency_code} />;
}
