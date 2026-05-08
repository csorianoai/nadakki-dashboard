import type { CaseState } from "@/lib/legal/cases/case-types";

/** Borde izquierdo al hover — prefijo hover: para composición en filas densas. */
export const stateRowHoverBorderClass: Record<CaseState, string> = {
  EVALUACION_INICIAL: "hover:border-l-sky-500",
  INGESTION: "hover:border-l-cyan-500",
  TRIAGE: "hover:border-l-violet-500",
  STRATEGY: "hover:border-l-indigo-500",
  ACTIVE: "hover:border-l-emerald-500",
  HEARING: "hover:border-l-amber-500",
  JUDGMENT: "hover:border-l-orange-500",
  APPEAL: "hover:border-l-pink-500",
  EXECUTION: "hover:border-l-blue-500",
  CLOSED: "hover:border-l-zinc-500",
  ARCHIVED: "hover:border-l-zinc-700",
};



/** Badge de estado — superficie textual (sin hex). */
export const stateBadgeClass: Record<CaseState, string> = {
  EVALUACION_INICIAL:
    "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/35",
  INGESTION: "bg-cyan-500/15 text-cyan-300 ring-1 ring-inset ring-cyan-500/35",
  TRIAGE: "bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/35",
  STRATEGY: "bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/35",
  ACTIVE: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/35",
  HEARING: "bg-amber-500/15 text-amber-200 ring-1 ring-inset ring-amber-500/35",
  JUDGMENT: "bg-orange-500/15 text-orange-200 ring-1 ring-inset ring-orange-500/35",
  APPEAL: "bg-pink-500/15 text-pink-300 ring-1 ring-inset ring-pink-500/35",
  EXECUTION: "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/35",
  CLOSED: "bg-zinc-500/15 text-zinc-300 ring-1 ring-inset ring-zinc-500/35",
  ARCHIVED: "bg-zinc-700/40 text-zinc-400 ring-1 ring-inset ring-zinc-600/45",
};

export function caseStateAccentClass(state: CaseState): string {
  return stateRowHoverBorderClass[state];
}
