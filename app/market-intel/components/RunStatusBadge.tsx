"use client";

import type { RunStatus } from "../lib/types";
import { RUN_STATUS_LABELS } from "../lib/constants";

const STATUS_STYLES: Record<RunStatus, string> = {
  draft: "bg-forgeGray-100 text-forgeGray-700 border-forgeGray-200",
  researching: "bg-forgeInfo-50 text-forgeInfo-700 border-forgeInfo-500/30",
  needs_validation: "bg-forgeWarning-50 text-forgeWarning-700 border-forgeWarning-500/30",
  validated: "bg-forgeSuccess-50 text-forgeSuccess-700 border-forgeSuccess-500/30",
};

/** Gate badge — always driven by run.status, never snapshot.validation_state. */
export function RunStatusBadge({ status }: { status: RunStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-forge-pill border px-3 py-1 text-forge-xs font-semibold ${STATUS_STYLES[status]}`}
      aria-label={`Estado: ${RUN_STATUS_LABELS[status]}`}
    >
      {RUN_STATUS_LABELS[status]}
    </span>
  );
}
