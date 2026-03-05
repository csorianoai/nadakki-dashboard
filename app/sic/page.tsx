"use client";

import { useTenant } from "@/contexts/TenantContext";
import SicDashboard from "@/frontend/src/pages/sic/sic_dashboard";

export default function SicPage() {
  const { tenantId } = useTenant();
  return <SicDashboard tenantId={tenantId} />;
}
