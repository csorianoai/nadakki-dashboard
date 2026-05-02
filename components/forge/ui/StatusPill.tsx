"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type StatusPillTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusPillTone;
}

const toneMap: Record<StatusPillTone, string> = {
  success: "bg-forgeSuccess-50 text-forgeSuccess-700 ring-1 ring-inset ring-forgeSuccess-500/40",
  warning: "bg-forgeWarning-50 text-forgeWarning-700 ring-1 ring-inset ring-forgeWarning-500/40",
  danger: "bg-forgeDanger-50 text-forgeDanger-700 ring-1 ring-inset ring-forgeDanger-500/40",
  info: "bg-forgeInfo-50 text-forgeInfo-700 ring-1 ring-inset ring-forgeInfo-500/40",
  neutral: "bg-forgeNeutral-50 text-forgeNeutral-700 ring-1 ring-inset ring-forgeInk-200",
};

/** Uppercase application status — pair with text; never color alone (a11y). */
export function StatusPill({ tone = "neutral", className, children, ...props }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] max-h-[22px] min-h-[22px] items-center rounded-forge-pill px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.025em]",
        toneMap[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
