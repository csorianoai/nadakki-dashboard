"use client";

import type { CSSProperties, ReactNode } from "react";
import type { CreditStipulation, StipulationsApiRole } from "@/lib/api/stipulations-types";
import { StipulationCard } from "@/components/bank/stipulations/StipulationCard";

export interface StipulationsListProps {
  applicationId: string;
  stipulations: CreditStipulation[];
  selectedId: string | null;
  role: StipulationsApiRole;
  canMutate: boolean;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
  /** Optional workflow toolbar (bulk actions, “nueva”, etc.) rendered before the list. */
  bulkActionsSlot?: ReactNode;
  listStyle?: CSSProperties;
}

/**
 * StipulationsList — live queue with optional bulk/workflow slot (Agent-4 T6.3).
 */
export function StipulationsList({
  applicationId,
  stipulations,
  selectedId,
  role,
  canMutate,
  onSelect,
  onPreview,
  onVerify,
  onReject,
  bulkActionsSlot,
  listStyle,
}: StipulationsListProps) {
  return (
    <div className="space-y-4">
      {bulkActionsSlot ? <div className="no-print flex flex-wrap gap-2">{bulkActionsSlot}</div> : null}
      <div className="space-y-4" data-testid="stipulations-list" style={listStyle}>
        {stipulations.map((s, i) => (
          <StipulationCard
            key={s.id}
            applicationId={applicationId}
            stipulation={s}
            selected={selectedId === s.id}
            indexLabel={`#${i + 1}`}
            role={role}
            canMutate={canMutate}
            onSelect={() => onSelect(s.id)}
            onPreview={() => onPreview(s.id)}
            onVerify={() => onVerify(s.id)}
            onReject={() => onReject(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
