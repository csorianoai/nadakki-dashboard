"use client";

import type { CreditEventRow } from "@/lib/credit-api";
import { cn } from "@/lib/utils";

export interface DealTimelineProps {
  state?: string | null;
  events?: CreditEventRow[] | null;
  loading?: boolean;
  className?: string;
}

const STATE_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-600",
  RECEIVED: "bg-sky-600",
  AI_ANALYSIS: "bg-violet-600",
  HYBRID_IN_PROGRESS: "bg-indigo-600",
  AI_COMPLETE: "bg-teal-600",
  BANK_SUBMITTED: "bg-blue-600",
  BANK_COMPLETE: "bg-cyan-600",
  OFFER_SELECTED: "bg-amber-600",
  COMPLETED: "bg-emerald-600",
  FAILED: "bg-red-600",
};

export function DealTimeline({
  state,
  events,
  loading,
  className,
}: DealTimelineProps) {
  if (loading) {
    return (
      <div className={cn("animate-pulse h-32 rounded-xl bg-white/5", className)} />
    );
  }

  const list = Array.isArray(events) ? [...events] : [];
  list.sort(
    (a, b) =>
      (a.emitted_at || "").localeCompare(b.emitted_at || "", undefined, {
        sensitivity: "base",
      })
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-200">Línea de tiempo</h3>
        {state && (
          <span
            className={cn(
              "text-[10px] font-semibold uppercase px-2 py-0.5 rounded text-white",
              STATE_BADGE[state] ?? "bg-slate-600"
            )}
          >
            {state}
          </span>
        )}
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          Sin eventos registrados todavía
        </p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {list.map((ev) => (
            <li
              key={ev.event_id ?? `${ev.event_type}-${ev.emitted_at}`}
              className="flex flex-col gap-0.5 border-l-2 border-violet-500/50 pl-3 py-1"
            >
              <span className="text-xs font-medium text-violet-300">
                {ev.event_type}
              </span>
              <span className="text-[11px] text-slate-500">
                {ev.emitted_at || "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
