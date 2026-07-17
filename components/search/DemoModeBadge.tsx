"use client";

import { HoverTooltip } from "@/components/ui/HoverTooltip";

export function DemoModeBadge({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <HoverTooltip text="Backend en modo demo, datos de muestra">
      <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
        DEMO
      </span>
    </HoverTooltip>
  );
}
