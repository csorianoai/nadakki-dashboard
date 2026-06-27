"use client";

import { humanizeToken } from "@/lib/legal/hearings/hearings-format";

/**
 * Status badge. Tolerant of UNKNOWN status values: the allowed set comes from
 * /config at runtime, so any string is rendered safely with a neutral style
 * instead of crashing.
 */
const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  CONFIRMED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  IN_PROGRESS: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  COMPLETED: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  POSTPONED: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  CANCELLED: "bg-red-500/15 text-red-300 ring-red-500/30",
  NO_SHOW: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

const NEUTRAL = "bg-zinc-700/20 text-zinc-300 ring-zinc-600/40";

export function HearingStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? NEUTRAL;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${style}`}
      data-status={status}
    >
      {humanizeToken(status)}
    </span>
  );
}
