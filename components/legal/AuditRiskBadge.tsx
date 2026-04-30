"use client";

import { cn } from "@/lib/utils";

export function AuditRiskBadge({ risk }: { risk?: string }) {
  const r = (risk || "").toLowerCase();
  const cls =
    r === "high"
      ? "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
      : r === "medium"
        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", cls)}>
      {risk || "—"}
    </span>
  );
}
