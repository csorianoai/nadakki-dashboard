"use client";

import { HearingCard } from "@/components/legal/hearings/HearingCard";
import { groupHearingsByDay, formatDayLabel } from "@/lib/legal/hearings/hearings-format";
import type { HearingOut } from "@/lib/legal/hearings/hearings-types";

/**
 * Simple calendar view: groups hearings by day (no calendar library, per the
 * no-new-dependency rule). On mobile this is naturally a per-day list.
 */
type Props = {
  tenantId: string;
  hearings: ReadonlyArray<HearingOut>;
  statuses: string[];
  canManage: boolean;
};

export function HearingsCalendarView({ tenantId, hearings, statuses, canManage }: Props) {
  const groups = groupHearingsByDay(hearings);

  return (
    <div className="space-y-6" data-view="calendar">
      {groups.map((group) => (
        <section key={group.dayKey} data-day={group.dayKey}>
          <h2 className="mb-3 text-sm font-medium capitalize text-zinc-300">
            {formatDayLabel(group.dayKey)}
            <span className="ml-2 text-xs font-normal text-zinc-500">
              ({group.items.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {group.items.map((h) => (
              <HearingCard
                key={h.id}
                tenantId={tenantId}
                hearing={h}
                statuses={statuses}
                canManage={canManage}
                hideDate
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
