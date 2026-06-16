"use client";

import { Suspense, useMemo } from "react";
import { DealerNotificationsView } from "@/components/credit-hub/dealer/DealerNotificationsView";
import { TableSkeleton } from "@/components/credit-hub/primitives";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { notificationsFromApplications } from "@/lib/credit-hub/dealer/dealerFormat";

function DealerNotificationsInner() {
  const applicationsQuery = useCreditApplications();
  const items = useMemo(() => notificationsFromApplications(applicationsQuery.data ?? []), [applicationsQuery.data]);

  return (
    <DealerNotificationsView
      items={items}
      isLoading={applicationsQuery.isLoading}
    />
  );
}

export default function DealerNotificationsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} />}>
      <DealerNotificationsInner />
    </Suspense>
  );
}
