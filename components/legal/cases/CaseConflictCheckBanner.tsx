"use client";

import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import type { CaseActor } from "@/lib/legal/cases/case-types";

export function CaseConflictCheckBanner({ actors }: { actors: CaseActor[] }) {
  const m = useLegalCasesMessages();
  const conflict = actors.some((a) => a.conflict_detected);
  if (!conflict) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-forge-sm border border-forgeDanger-500 bg-forgeDanger-50 px-4 py-3 text-sm text-forgeDanger-900"
    >
      {m.actors.conflict_banner}
    </div>
  );
}
