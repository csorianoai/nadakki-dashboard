"use client";

import type { StipulationStatus } from "@/lib/api/stipulations-types";

const STYLES: Record<StipulationStatus, string> = {
  pending: "bg-amber-50 text-amber-900 ring-amber-200",
  uploaded: "bg-sky-50 text-sky-900 ring-sky-200",
  verified: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-900 ring-rose-200",
};

const LABELS: Record<StipulationStatus, string> = {
  pending: "Pendiente",
  uploaded: "Subido",
  verified: "Verificado",
  rejected: "Rechazado",
};

export interface StipulationStatusBadgeProps {
  status: StipulationStatus;
  className?: string;
}

export function StipulationStatusBadge({ status, className = "" }: StipulationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-forge-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${STYLES[status]} ${className}`}
      data-testid={`stipulation-status-${status}`}
    >
      {LABELS[status]}
    </span>
  );
}
