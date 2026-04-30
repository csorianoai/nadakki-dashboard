"use client";

import type { LegalHealthResponse } from "@/types/legal";
import { cn } from "@/lib/utils";

export function LegalStatusBadge({
  health,
  loading,
}: {
  health: LegalHealthResponse | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-800">Estado…</span>
    );
  }
  if (!health) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        No disponible
      </span>
    );
  }
  const s = health.status;
  const cls =
    s === "healthy"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"
      : s === "degraded"
        ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
        : "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100";
  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-medium capitalize", cls)}>Core: {s}</span>
  );
}
