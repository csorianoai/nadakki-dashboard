"use client";

import type { ConfidenceLevel } from "@/types/spyfu";
import clsx from "clsx";

export function ConfidenceBadge({ level }: { level?: ConfidenceLevel | string }) {
  const l = (level || "medium").toLowerCase();
  const cls =
    l === "high"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : l === "low"
        ? "bg-red-500/20 text-red-300 border-red-500/40"
        : "bg-amber-500/20 text-amber-200 border-amber-500/40";
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        cls
      )}
    >
      {l}
    </span>
  );
}
