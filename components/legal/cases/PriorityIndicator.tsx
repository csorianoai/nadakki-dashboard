"use client";

import type { CasePriority } from "@/lib/legal/cases/case-types";
import { priorityDotClass } from "@/lib/legal/cases/priority-colors";
import { cn } from "@/lib/utils";

type Props = {
  priority: CasePriority;
  ariaLabel: string;
  className?: string;
};

export function PriorityIndicator({ priority, ariaLabel, className }: Props) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)} role="img" aria-label={ariaLabel}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", priorityDotClass[priority])} aria-hidden />
    </span>
  );
}
