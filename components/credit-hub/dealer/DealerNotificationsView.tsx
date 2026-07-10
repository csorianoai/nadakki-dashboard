"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyStateRich, TableSkeleton } from "@/components/credit-hub/primitives";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { NotificationCard } from "@/components/credit-hub/dealer/sections/NotificationCard";
import type { DealerNotificationsViewProps, DealerNotificationTab } from "@/lib/credit-hub/types/dealer-views";
import { markNotificationRead } from "@/lib/credit-hub/dealer/dealerFormat";
import { dealerDetailHref } from "@/lib/credit-hub/dealer/dealerFormat";

const TABS: { id: DealerNotificationTab; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "No leídas" },
  { id: "decisions", label: "Decisiones" },
  { id: "system", label: "Sistema" },
];

export function DealerNotificationsView({ items, isLoading, sourceUnavailable, onMarkRead }: DealerNotificationsViewProps) {
  const [tab, setTab] = useState<DealerNotificationTab>("all");
  const [readOverride, setReadOverride] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const merged = items.map((n) => ({ ...n, read: n.read || readOverride.has(n.id) }));
    switch (tab) {
      case "unread":
        return merged.filter((n) => !n.read);
      case "decisions":
        return merged.filter((n) => n.category === "decision");
      case "system":
        return merged.filter((n) => n.category === "system");
      default:
        return merged;
    }
  }, [items, tab, readOverride]);

  const markRead = (id: string) => {
    if (onMarkRead) {
      void onMarkRead(id);
    } else {
      markNotificationRead(id);
    }
    setReadOverride((prev) => new Set(prev).add(id));
  };

  if (isLoading) return <TableSkeleton rows={5} />;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 className="ch-serif" style={{ margin: 0, fontSize: 26, letterSpacing: "-0.01em" }}>
          Notificaciones
        </h1>
        <p style={{ fontSize: 13, color: "var(--ch-text-3)", marginTop: 6 }}>
          {sourceUnavailable
            ? "El servicio de notificaciones aún no está conectado. Sin alertas sintéticas."
            : "Actualizaciones de tus solicitudes."}
        </p>
        {sourceUnavailable ? <DataTruthBadge level="ROADMAP" /> : null}
      </div>

      <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16, borderBottom: "1px solid var(--ch-line)", paddingBottom: 8 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className="ch-btn ch-btn-sm"
            style={{
              minHeight: 44,
              background: tab === t.id ? "var(--ch-persona-soft)" : "transparent",
              color: tab === t.id ? "var(--ch-persona-text)" : "var(--ch-text-3)",
              border: tab === t.id ? "1px solid var(--ch-persona-line)" : "1px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyStateRich
          variant="empty"
          title={sourceUnavailable ? "Notificaciones no conectadas" : "Sin alertas pendientes"}
          description={
            sourceUnavailable
              ? "Cuando el backend publique GET /api/v2/credit/notifications, las alertas aparecerán aquí."
              : "Las notificaciones de tus solicitudes aparecerán aquí."
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((n) => (
            <NotificationCard
              key={n.id}
              item={n}
              href={dealerDetailHref(n.applicationId)}
              onMarkRead={() => markRead(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
