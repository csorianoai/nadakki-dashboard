"use client";

import { motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ForgeCard } from "../primitives/ForgeCard";
import { CountUpNumber } from "./CountUpNumber";

interface MetricCardProps {
  label: string;
  value: number | null;
  trend?: {
    direction: "up" | "down" | "flat";
    delta: number;
    label: string;
  };
  progress?: {
    value: number;
    label?: string;
  };
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ForgeMetricCard({ label, value, trend, progress, loading, onClick, className }: MetricCardProps) {
  if (loading) {
    return (
      <ForgeCard className={cn("relative overflow-hidden", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-2/3 rounded bg-forge-surface-elevated" />
          <div className="h-10 w-1/2 rounded bg-forge-surface-elevated" />
          <div className="h-3 w-1/3 rounded bg-forge-surface-elevated" />
        </div>
      </ForgeCard>
    );
  }

  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const trendColor =
    trend?.direction === "up" ? "text-forge-success" : trend?.direction === "down" ? "text-forge-danger" : "text-forge-text-muted";

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} onClick={onClick} className={cn(onClick && "cursor-pointer", className)}>
      <ForgeCard className="group relative">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-forge-primary/0 to-forge-primary/0 transition-all duration-300 group-hover:from-forge-primary/5 group-hover:to-forge-accent/5" />

        <div className="relative space-y-3">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-forge-text-muted">{label}</p>
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span className="font-semibold">
                  {trend.delta > 0 ? "+" : ""}
                  {trend.delta}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-forge-text md:text-4xl">
              {value === null ? <span className="text-forge-text-muted">—</span> : <CountUpNumber value={value} duration={1.5} />}
            </span>
          </div>

          {trend && <p className="text-xs text-forge-text-muted">{trend.label}</p>}

          {progress && (
            <div className="space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-forge-surface-elevated">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-forge-primary to-forge-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, progress.value))}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              {progress.label && <p className="text-xs text-forge-text-muted">{progress.label}</p>}
            </div>
          )}
        </div>
      </ForgeCard>
    </motion.div>
  );
}
