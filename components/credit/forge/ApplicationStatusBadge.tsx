"use client";

import { formatApplicationStateLabel } from "@/lib/credit-hub/honesty/display-status";

const TERMINAL = new Set(["COMPLETED", "DECLINED", "CANCELLED", "REJECTED", "CLOSED"]);

function tone(state: string | null | undefined): string {
  const s = (state ?? "").toUpperCase();
  if (!s) return "bg-slate-500/15 text-slate-300 ring-slate-400/20";
  if (TERMINAL.has(s)) {
    if (s === "COMPLETED") return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/25";
    return "bg-rose-500/15 text-rose-200 ring-rose-400/25";
  }
  if (s.includes("REVIEW") || s.includes("PENDING") || s.includes("SUBMIT"))
    return "bg-amber-500/15 text-amber-100 ring-amber-400/25";
  if (s.includes("DRAFT")) return "bg-slate-500/20 text-slate-200 ring-slate-400/20";
  if (s.includes("PROCESS")) return "bg-sky-500/15 text-sky-100 ring-sky-400/25";
  return "bg-violet-500/15 text-violet-100 ring-violet-400/25";
}

export function ApplicationStatusBadge({ state }: { state: string | null | undefined }) {
  const label = formatApplicationStateLabel(state);
  const raw = (state ?? "").toUpperCase();
  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ${tone(state)}`}
      title={raw || undefined}
    >
      {label}
    </span>
  );
}
