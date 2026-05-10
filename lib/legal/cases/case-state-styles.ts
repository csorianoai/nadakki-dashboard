import type { CaseState } from "@/lib/legal/cases/case-types";

const STATE_RING: Record<CaseState, string> = {
  EVALUACION_INICIAL: "bg-forgeInfo-50 text-forgeInfo-700 ring-forgeInfo-500",
  INGESTION: "bg-forgeNeutral-50 text-forgeGray-800 ring-forgeNeutral-500",
  TRIAGE: "bg-forgeWarning-50 text-forgeWarning-700 ring-forgeWarning-500",
  STRATEGY: "bg-forgeBrand-50 text-forgeBrand-700 ring-forgeBrand-500",
  ACTIVE: "bg-forgeSuccess-50 text-forgeSuccess-700 ring-forgeSuccess-500",
  HEARING: "bg-forgeBrand-100 text-forgeBrand-800 ring-forgeBrand-400",
  JUDGMENT: "bg-forgeDanger-50 text-forgeDanger-700 ring-forgeDanger-500",
  APPEAL: "bg-forgeInfo-50 text-forgeInfo-800 ring-forgeInfo-400",
  EXECUTION: "bg-forgeWarning-50 text-forgeWarning-800 ring-forgeWarning-400",
  CLOSED: "bg-forgeGray-100 text-forgeGray-600 ring-forgeGray-300",
  ARCHIVED: "bg-forgeGray-50 text-forgeGray-500 ring-forgeGray-200",
};

export function caseStatePillClass(state: CaseState): string {
  return STATE_RING[state] ?? "bg-forgeNeutral-50 text-forgeGray-700 ring-forgeNeutral-500";
}
