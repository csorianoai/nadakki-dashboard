"use client";

import { HearingCard } from "@/components/legal/hearings/HearingCard";
import type { HearingOut } from "@/lib/legal/hearings/hearings-types";

type Props = {
  tenantId: string;
  hearings: ReadonlyArray<HearingOut>;
  statuses: string[];
  canManage: boolean;
};

export function HearingsListView({ tenantId, hearings, statuses, canManage }: Props) {
  return (
    <div className="space-y-3" data-view="list">
      {hearings.map((h) => (
        <HearingCard
          key={h.id}
          tenantId={tenantId}
          hearing={h}
          statuses={statuses}
          canManage={canManage}
        />
      ))}
    </div>
  );
}
