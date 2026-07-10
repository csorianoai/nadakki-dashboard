"use client";

import { Suspense } from "react";
import { DealerNotificationsView } from "@/components/credit-hub/dealer/DealerNotificationsView";
import { TableSkeleton } from "@/components/credit-hub/primitives";
import { useNotifications } from "@/lib/credit-hub/hooks/useNotifications";
import type { DealerNotificationItem } from "@/lib/credit-hub/types/dealer-views";

function mapNotificationItem(n: {
  id?: string;
  title: string;
  body?: string;
  read?: boolean;
  at?: string;
  category?: string;
  application_id?: string;
}): DealerNotificationItem {
  const category =
    n.category === "decision" || n.category === "system" || n.category === "update"
      ? n.category
      : "update";
  return {
    id: n.id ?? "",
    applicationId: n.application_id ?? "",
    title: n.title,
    body: n.body ?? "",
    category,
    createdAt: n.at ?? "",
    read: Boolean(n.read),
  };
}

function DealerNotificationsInner() {
  const { items, isLoading, hidden, markAsRead } = useNotifications();

  return (
    <DealerNotificationsView
      items={items.map(mapNotificationItem)}
      isLoading={isLoading}
      sourceUnavailable={hidden}
      onMarkRead={(id) => void markAsRead(id)}
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
