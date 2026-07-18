"use client";

import { HoverTooltip } from "@/components/ui/HoverTooltip";
import type { LeadSignal } from "@/lib/dealer/leads-mock";

export function LeadSignalsList({ signals }: { signals: LeadSignal[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {signals.map((s) => (
        <li key={s.id}>
          <HoverTooltip text={s.explanation}>
            <span className="inline-flex items-center gap-1 rounded-full border border-nk-border bg-nk-surface-2 px-2.5 py-1 text-xs font-semibold text-nk-fg">
              <span aria-hidden>{s.icon}</span>
              {s.label}
            </span>
          </HoverTooltip>
        </li>
      ))}
    </ul>
  );
}
