"use client";

import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

export function Skeleton({ className, label = "Loading" }: SkeletonProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("block animate-pulse rounded-forge-sm bg-forgeInk-100", className)}
    />
  );
}
