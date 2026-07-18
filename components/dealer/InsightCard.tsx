"use client";

import { cn } from "@/lib/utils";
import type { InsightPriority, InsightStatus, DealerInsight } from "@/lib/dealer/insights-mock";

const PRIORITY_CLASS: Record<InsightPriority, string> = {
  alta: "bg-red-500/15 text-red-600 dark:text-red-400",
  media: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  baja: "bg-nk-surface-3 text-nk-fg-muted",
};

export function InsightCard({
  insight,
  onPrimary,
  onSecondary,
}: {
  insight: DealerInsight;
  onPrimary?: () => void;
  onSecondary?: () => void;
}) {
  const statusLabel: Record<InsightStatus, string | null> = {
    new: null,
    applied: "Aplicado",
    dismissed: "Descartado",
  };

  return (
    <article
      className={cn(
        "rounded-r-sm border p-5",
        insight.type === "critical"
          ? "border-red-500/30 bg-red-500/5"
          : "border-nk-border bg-nk-surface",
        insight.status !== "new" && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>
            {insight.icon}
          </span>
          <div>
            <h3 className="font-manrope text-base font-bold text-nk-fg">{insight.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-nk-fg-muted">{insight.description}</p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
            PRIORITY_CLASS[insight.priority],
          )}
        >
          {insight.priority} prioridad
        </span>
      </div>

      {statusLabel[insight.status] ? (
        <p className="mt-2 text-xs font-semibold text-nk-fg-subtle">{statusLabel[insight.status]}</p>
      ) : null}

      {(insight.primaryAction || insight.secondaryAction) && insight.status === "new" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {insight.primaryAction ? (
            <button
              type="button"
              onClick={onPrimary}
              className="rounded-full bg-brand-2 px-4 py-2 text-sm font-bold text-white"
            >
              {insight.primaryAction}
            </button>
          ) : null}
          {insight.secondaryAction ? (
            <button
              type="button"
              onClick={onSecondary}
              className="rounded-full border border-nk-border px-4 py-2 text-sm font-semibold text-nk-fg-muted"
            >
              {insight.secondaryAction}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
