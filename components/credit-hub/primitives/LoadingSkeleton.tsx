"use client";

import { cn } from "@/lib/utils";
import type { LoadingSkeletonProps } from "@/lib/credit-hub/ch-types";

export function LoadingSkeleton({ className, rows = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="ch-skeleton h-4 w-full" />
      ))}
    </div>
  );
}

export function KpiStripSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)} aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="ch-card p-4">
          <div className="ch-skeleton mb-3 h-3 w-20" />
          <div className="ch-skeleton h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ className, rows = 5 }: LoadingSkeletonProps) {
  return (
    <div className={cn("ch-card overflow-hidden p-0", className)} aria-hidden>
      <div className="ch-skeleton h-10 w-full rounded-none" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="border-t px-4 py-3" style={{ borderColor: "var(--ch-line)" }}>
          <div className="ch-skeleton h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)} aria-hidden>
      <div className="ch-skeleton h-8 w-2/3 max-w-md" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="ch-card p-4 lg:col-span-2">
          <div className="ch-skeleton mb-3 h-4 w-32" />
          <div className="ch-skeleton h-24 w-full" />
        </div>
        <div className="ch-card p-4">
          <div className="ch-skeleton mb-3 h-4 w-24" />
          <div className="ch-skeleton h-32 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("ch-card p-4", className)} aria-hidden>
      <div className="ch-skeleton mb-4 h-4 w-40" />
      <div className="ch-skeleton h-40 w-full" />
    </div>
  );
}
