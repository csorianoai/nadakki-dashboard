"use client";

import { getRunStatusLabel, getRunStatusStyle } from "../lib/constants";

/** Gate badge — always driven by run.status, never snapshot.validation_state. */
export function RunStatusBadge({ status }: { status: string }) {
  const label = getRunStatusLabel(status);
  return (
    <span
      className={`inline-flex items-center rounded-forge-pill border px-3 py-1 text-forge-xs font-semibold ${getRunStatusStyle(status)}`}
      aria-label={`Estado: ${label}`}
    >
      {label}
    </span>
  );
}
