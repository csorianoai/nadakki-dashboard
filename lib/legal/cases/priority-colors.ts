import type { CasePriority } from "@/lib/legal/cases/case-types";

/** Indicadores de prioridad — colores institucionales coherentes con la lista de trabajo. */
export const priorityDotClass: Record<CasePriority, string> = {
  critical: "bg-red-500 shadow-[0_0_12px_-2px] shadow-red-500/60 animate-pulse",
  high: "bg-orange-500",
  normal: "bg-zinc-400",
  low: "bg-zinc-600",
};
