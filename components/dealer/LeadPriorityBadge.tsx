"use client";

import { cn } from "@/lib/utils";
import type { LeadTier } from "@/lib/dealer/leads-mock";

const TIER_CONFIG: Record<
  LeadTier,
  { emoji: string; label: string; className: string }
> = {
  hot: { emoji: "🔥", label: "Hot", className: "bg-red-500/15 text-red-600 dark:text-red-400" },
  warm: { emoji: "☀️", label: "Warm", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
  cold: { emoji: "❄️", label: "Cold", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
};

export function LeadPriorityBadge({ score, tier }: { score: number; tier: LeadTier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-black",
        cfg.className,
      )}
    >
      <span aria-hidden>{cfg.emoji}</span>
      {score}
    </span>
  );
}
