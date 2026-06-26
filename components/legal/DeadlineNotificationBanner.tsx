"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { useUpcomingDeadlines } from "@/hooks/legal/useUpcomingDeadlines";
import type { UpcomingDeadline } from "@/hooks/legal/useUpcomingDeadlines";
import { daysUntil } from "@/lib/legal/cases/deadline-formatter";

function urgencyClass(days: number, isPeremptory: boolean): string {
  if (days <= 0) return "border-red-500 bg-red-950/50 text-red-100";
  if (isPeremptory && days <= 3)
    return "border-red-500 bg-red-950/40 text-red-200 ring-1 ring-red-500/40";
  if (days <= 3) return "border-red-500/50 bg-red-950/30 text-red-200";
  if (days <= 7) return "border-amber-500/50 bg-amber-950/30 text-amber-200";
  return "border-zinc-700/50 bg-zinc-900/40 text-zinc-300";
}

export function DeadlineNotificationBanner() {
  const { effectiveTenantId, tenantHydrated } = useLegalEffectiveTenantId();
  const { data, isLoading } = useUpcomingDeadlines(effectiveTenantId, 7);

  if (!tenantHydrated || isLoading) return null;

  const deadlines = (data?.deadlines ?? []) as UpcomingDeadline[];
  if (deadlines.length === 0) return null;

  const urgent = deadlines.filter((d) => daysUntil(d.effective_deadline_date) <= 3);
  const soon = deadlines.filter(
    (d) => daysUntil(d.effective_deadline_date) > 3 && daysUntil(d.effective_deadline_date) <= 7,
  );

  const primaryList = urgent.length > 0 ? urgent : soon;

  const hasOverdueOrPeremptory = primaryList.some(
    (d) => daysUntil(d.effective_deadline_date) <= 0 || (d.is_peremptory && daysUntil(d.effective_deadline_date) <= 3),
  );

  return (
    <div
      role="alert"
      className="mb-4"
      data-testid="deadline-notification-banner"
    >
      <p className={`mb-2 flex items-center gap-1.5 text-sm font-semibold ${hasOverdueOrPeremptory ? "text-red-300" : "text-amber-300"}`}>
        {hasOverdueOrPeremptory && <AlertTriangle className="h-4 w-4 shrink-0" />}
        {primaryList.length === 1
          ? hasOverdueOrPeremptory
            ? "1 plazo requiere atención inmediata"
            : "1 plazo próximo a vencer"
          : hasOverdueOrPeremptory
            ? `${primaryList.length} plazos requieren atención inmediata`
            : `${primaryList.length} plazos próximos a vencer`}
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {primaryList.slice(0, 6).map((d) => {
          const rem = daysUntil(d.effective_deadline_date);
          return (
            <Link
              href={`/legal/cases/${d.case_id}`}
              key={d.deadline_id}
              className={`rounded-lg border px-3 py-2 transition-transform hover:scale-[1.02] ${urgencyClass(rem, d.is_peremptory)}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{d.case_title || d.case_number_internal}</span>
                <span className="shrink-0 text-xs font-semibold">{rem <= 0 ? "VENCIDO" : `${rem}d`}</span>
              </div>
              <p className="mt-0.5 text-xs opacity-90">
                {d.deadline_db_id}{d.is_peremptory ? " · perentorio" : ""}
              </p>
            </Link>
          );
        })}
      </div>

      {primaryList.length > 6 && (
        <p className="mt-2 text-xs text-zinc-400">
          y {primaryList.length - 6} más…
        </p>
      )}
    </div>
  );
}
