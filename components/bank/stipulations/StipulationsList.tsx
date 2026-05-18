"use client";

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
}

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
}: StipulationsListProps) {
  return (
    <div className="space-y-4" data-testid="stipulations-list">
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
  );
}
