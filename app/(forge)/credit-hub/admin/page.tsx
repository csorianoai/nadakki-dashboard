"use client";

import { AdminNetworkOsView } from "@/components/credit-hub/admin/AdminNetworkOsView";
import { CHAdminAccessGuard } from "@/components/credit-hub/system/CHAdminAccessGuard";

export default function CreditHubAdminPage() {
  return (
    <CHAdminAccessGuard>
      <AdminNetworkOsView />
    </CHAdminAccessGuard>
  );
}
