import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ForgeBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

export function ForgeBadge({ tone = "neutral", className, children, ...props }: ForgeBadgeProps) {
  const tones = {
    neutral: "bg-forge-surface-elevated text-forge-text-muted border-forge-border",
    success: "bg-forge-success/10 text-forge-success border-forge-success/30",
    warning: "bg-forge-warning/10 text-forge-warning border-forge-warning/30",
    danger: "bg-forge-danger/10 text-forge-danger border-forge-danger/30",
    info: "bg-forge-info/10 text-forge-info border-forge-info/30",
  };

  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone], className)}
      {...props}
    >
      {children}
    </span>
  );
}
