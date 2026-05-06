"use client";

import type { DisasterLevel } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export function CaseDisasterModeBanner({ level }: { level: DisasterLevel }) {
  const m = useLegalCasesMessages();
  if (level === "NORMAL") return null;
  const text =
    level === "LLM_DEGRADED"
      ? m.disaster_mode.LLM_DEGRADED
      : level === "RAG_DEGRADED"
        ? m.disaster_mode.RAG_DEGRADED
        : m.disaster_mode.CRITICAL_FALLBACK;
  return (
    <div
      role="status"
      className="mb-4 rounded-forge-sm border border-forgeWarning-500 bg-forgeWarning-50 px-4 py-3 text-sm text-forgeInk-800"
    >
      {text}
    </div>
  );
}
