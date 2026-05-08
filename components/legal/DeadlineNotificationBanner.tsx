"use client";

import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { useUpcomingDeadlines } from "@/hooks/legal/useUpcomingDeadlines";
import type { UpcomingDeadline } from "@/hooks/legal/useUpcomingDeadlines";
import { daysUntil } from "@/lib/legal/cases/deadline-formatter";

function urgencyClass(days: number): string {
  if (days <= 3) return "border-forgeDanger-600 bg-forgeDanger-50 text-forgeDanger-800";
  if (days <= 7) return "border-yellow-500 bg-yellow-50 text-yellow-800";
  return "border-forgeBrand-400 bg-forgeBrand-50 text-forgeBrand-800";
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
  const days = primaryList.length > 0 ? daysUntil(primaryList[0].effective_deadline_date) : 7;
  const cls = urgencyClass(days);

  return (
    <div
      role="alert"
      className={`mb-4 rounded-forge-md border px-4 py-3 text-sm ${cls}`}
      data-testid="deadline-notification-banner"
    >
      <p className="font-semibold">
        {deadlines.length === 1
          ? "1 plazo próximo a vencer"
          : `${deadlines.length} plazos próximos a vencer`}
      </p>
      <ul className="mt-1 space-y-0.5">
        {primaryList.slice(0, 3).map((d) => {
          const remaining = daysUntil(d.effective_deadline_date);
          return (
            <li key={d.deadline_id} className="text-xs">
              <span className="font-medium">{d.case_title || d.case_number_internal}</span>
              {" — "}
              {d.deadline_db_id}
              {" · "}
              {remaining <= 0 ? "Vencido" : `${remaining}d`}
              {d.is_peremptory ? " (perentorio)" : ""}
            </li>
          );
        })}
        {primaryList.length > 3 && (
          <li className="text-xs opacity-75">
            y {primaryList.length - 3} más…
          </li>
        )}
      </ul>
    </div>
  );
}
