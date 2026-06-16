"use client";

import Link from "next/link";
import type { DealerNotificationItem } from "@/lib/credit-hub/types/dealer-views";
import { chRelTimeDealer } from "@/lib/credit-hub/dealer/dealerFormat";

export function NotificationCard({
  item,
  href,
  onMarkRead,
}: {
  item: DealerNotificationItem;
  href: string;
  onMarkRead: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        if (!item.read) onMarkRead();
      }}
      className="ch-card block no-underline"
      style={{
        padding: 14,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        border: item.read ? "1px solid var(--ch-line)" : "1px solid var(--ch-persona-line)",
        background: item.read ? "var(--ch-surface)" : "var(--ch-persona-soft)",
        minHeight: 44,
      }}
    >
      {!item.read ? (
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: 999, background: "var(--ch-persona)", marginTop: 6, flexShrink: 0 }}
        />
      ) : (
        <span style={{ width: 8, flexShrink: 0 }} aria-hidden />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: item.read ? 500 : 600, color: "var(--ch-text)" }}>{item.title}</div>
        <div style={{ fontSize: 13, color: "var(--ch-text-3)", marginTop: 4 }}>{item.body}</div>
        <div className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-4)", marginTop: 6 }}>
          {chRelTimeDealer(item.createdAt)}
        </div>
      </div>
    </Link>
  );
}
