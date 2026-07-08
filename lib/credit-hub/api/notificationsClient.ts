import { chFetch } from "./client";
import type { ChNotification } from "../ch-types";

export interface CreditNotificationsResponse {
  tenant_id?: string;
  notifications: Array<{
    id: string;
    title: string;
    body?: string;
    read?: boolean;
    created_at?: string;
    application_id?: string;
    category?: string;
  }>;
  unread_count?: number;
}

export async function getCreditNotifications(params: {
  tenantId: string;
  unreadOnly?: boolean;
}): Promise<{ items: ChNotification[]; unreadCount: number }> {
  const q = params.unreadOnly ? "?unread_only=true" : "";
  const data = await chFetch<CreditNotificationsResponse>(`/api/v2/credit/notifications${q}`, {
    tenantId: params.tenantId,
    actorRole: "dealer",
  });
  const items: ChNotification[] = (data.notifications ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    read: n.read,
    at: n.created_at,
  }));
  const unreadCount =
    data.unread_count ?? items.filter((n) => !n.read).length;
  return { items, unreadCount };
}

export async function markNotificationRead(params: {
  tenantId: string;
  notificationId: string;
}): Promise<void> {
  await chFetch<unknown>(
    `/api/v2/credit/notifications/${encodeURIComponent(params.notificationId)}/read`,
    {
      tenantId: params.tenantId,
      actorRole: "dealer",
      method: "PATCH",
      body: JSON.stringify({ read: true }),
    },
  );
}
