"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LegalMetricCard({
  title,
  value,
  subtitle,
  icon,
  loading,
}: {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </div>
        {icon && <div className="text-slate-400 dark:text-slate-500">{icon}</div>}
      </div>
    </div>
  );
}
