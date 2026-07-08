"use client";

import { Suspense } from "react";
import { DealerNotificationsView } from "@/components/credit-hub/dealer/DealerNotificationsView";
import { TableSkeleton } from "@/components/credit-hub/primitives";

/** Notifications API not deployed (404 on Render). No synthetic rows from applications. */
function DealerNotificationsInner() {
  return (
    <DealerNotificationsView
      items={[]}
      isLoading={false}
      sourceUnavailable
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
