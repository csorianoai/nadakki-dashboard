"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const map: Record<BadgeVariant, string> = {
  success: "bg-forgeSuccess-50 text-forgeSuccess-700 border-forgeSuccess-500/30",
  warning: "bg-forgeWarning-50 text-forgeWarning-700 border-forgeWarning-500/30",
  danger: "bg-forgeDanger-50 text-forgeDanger-700 border-forgeDanger-500/30",
  info: "bg-forgeInfo-50 text-forgeInfo-700 border-forgeInfo-500/30",
  neutral: "bg-forgeNeutral-50 text-forgeNeutral-700 border-forgeGray-200",
};

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-forge-pill border px-2 py-0.5 text-forge-xs font-medium tracking-wide",
        map[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
