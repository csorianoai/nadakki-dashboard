"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: ReactNode;
  className?: string;
}

export function KpiCard({ label, value, hint, trend, className }: KpiCardProps) {
  return (
    <div className={cn("rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-4 shadow-forge-xs", className)}>
      <p className="text-forge-xs font-medium uppercase tracking-wide text-forgeInk-500">{label}</p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <p className="font-display text-forge-md font-semibold text-forgeInk-800">{value}</p>
        {trend ? <span className="text-forge-xs text-forgeInk-600">{trend}</span> : null}
      </div>
      {hint ? <p className="mt-2 text-forge-xs text-forgeInk-500">{hint}</p> : null}
    </div>
  );
}
