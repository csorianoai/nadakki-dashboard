"use client";

import type { CaseState } from "@/lib/legal/cases/case-types";
import { stateBadgeClass } from "@/lib/legal/cases/state-colors";
import { cn } from "@/lib/utils";

type Props = {
  state: CaseState;
  label: string;
};

/** Badge institucional unificado para estados procesales (tipografía diminuta alta legibilidad). */
export function StateBadge({ state, label }: Props) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        stateBadgeClass[state]
      )}
    >
      {label}
    </span>
  );
}
