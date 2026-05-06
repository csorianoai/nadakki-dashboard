"use client";

import type { CaseState } from "@/lib/legal/cases/case-types";
import { caseStatePillClass } from "@/lib/legal/cases/case-state-styles";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export function CaseStateIndicator({ state }: { state: CaseState }) {
  const m = useLegalCasesMessages();
  const label = m.states[state] ?? state;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${caseStatePillClass(state)}`}
    >
      {label}
    </span>
  );
}
