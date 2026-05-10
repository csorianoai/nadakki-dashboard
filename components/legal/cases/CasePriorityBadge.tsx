"use client";

import type { CasePriority } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

const CLS: Record<CasePriority, string> = {
  low: "bg-forgeNeutral-50 text-forgeGray-600 ring-forgeNeutral-500",
  normal: "bg-forgeBrand-50 text-forgeBrand-800 ring-forgeBrand-400",
  high: "bg-forgeWarning-50 text-forgeWarning-800 ring-forgeWarning-500",
  critical: "bg-forgeDanger-50 text-forgeDanger-800 ring-forgeDanger-600",
};

export function CasePriorityBadge({ priority }: { priority: CasePriority }) {
  const m = useLegalCasesMessages();
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${CLS[priority]}`}
    >
      {m.priority[priority]}
    </span>
  );
}
