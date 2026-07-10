"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchActivity } from "../api/observability";
import { DemoPanelBadge } from "../components/DemoPanelBadge";
import { PanelError, PanelFrame, PanelSkeleton } from "../components/PanelFrame";
import type { ActivityItem } from "../types";

const CORE_CHIP: Record<string, string> = {
  credit_hub: "#2563eb",
  legal: "#7c3aed",
  marketing: "#db2777",
  sic: "#059669",
};

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchActivity(10);
      setItems(res.data.items ?? []);
      setIsDemo(res.isDemo);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar actividad");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PanelFrame title="Actividad reciente" badge={isDemo ? <DemoPanelBadge /> : undefined} testId="cockpit-activity">
      {loading ? <PanelSkeleton /> : null}
      {!loading && error && items.length === 0 ? <PanelError message={error} onRetry={load} /> : null}
      {!loading && items.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex gap-2 border-b border-[var(--ch-line)] pb-2 last:border-0">
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ background: CORE_CHIP[item.core_code] ?? "#64748b" }}
                aria-hidden
              />
              <div>
                <p>{item.message}</p>
                <p className="text-xs text-[var(--ch-text-3)]">
                  {item.core_code} · {item.actor ?? "—"} · {formatTime(item.at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </PanelFrame>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}
