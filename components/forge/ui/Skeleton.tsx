"use client";

import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
  /** Accessible label for screen readers. Omit for decorative skeletons (parent sets `aria-busy`). */
  label?: string;
}

export function Skeleton({ className, label }: SkeletonProps) {
  const decorative = label === undefined || label === "" || label.trim() === "";
  return (
    <span
      {...(decorative
        ? { "aria-hidden": true as const }
        : { role: "status" as const, "aria-label": label })}
      className={cn("block animate-pulse rounded-forge-sm bg-forgeGray-100", className)}
    />
  );
}
