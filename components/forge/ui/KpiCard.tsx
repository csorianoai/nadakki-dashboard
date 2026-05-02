"use client";

import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KpiCardTrend {
  direction: "up" | "down" | "neutral";
  /** e.g. "+12%" or "−3%" */
  value: string;
  /** e.g. "vs last week" */
  label: string;
}

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  trend?: KpiCardTrend;
  hint?: string;
  className?: string;
}

export function KpiCard({ label, value, icon: Icon, trend, hint, className }: KpiCardProps) {
  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const trendColor =
    trend?.direction === "up"
      ? "text-forgeSuccess-700"
      : trend?.direction === "down"
        ? "text-forgeDanger-600"
        : "text-forgeInk-500";

  return (
    <div
      className={cn(
        "rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-5 shadow-forge-xs",
        "cursor-default transition-shadow duration-100 ease-out motion-reduce:transition-none",
        "hover:shadow-forge-md",
        className
      )}
    >
      <div className="flex min-w-0 items-center">
        {Icon ? <Icon className="mr-2 h-6 w-6 shrink-0 text-forgeBrand-600" aria-hidden /> : null}
        <p className="min-w-0 text-forge-xs font-medium uppercase tracking-wide text-forgeInk-500">{label}</p>
      </div>
      <div
        className="mt-3 font-display font-semibold tabular-nums leading-none text-forgeInk-800 [&_.animate-pulse]:rounded-forge-sm"
        style={{ fontSize: "clamp(32px, 4vw, 44px)" }}
      >
        {value}
      </div>
      {trend ? (
        <div className={cn("mt-2 flex flex-wrap items-center gap-1 font-sans text-[13px]", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="font-medium tabular-nums">{trend.value}</span>
          <span className="text-forgeInk-600">{trend.label}</span>
        </div>
      ) : null}
      {hint ? <p className="mt-2 text-forge-xs text-forgeInk-500">{hint}</p> : null}
    </div>
  );
}
