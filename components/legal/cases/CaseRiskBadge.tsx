"use client";

import { useState } from "react";
import type { RiskProfile } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

function riskTone(score: number): string {
  if (score >= 0.75) return "bg-forgeDanger-50 text-forgeDanger-800 ring-forgeDanger-500";
  if (score >= 0.45) return "bg-forgeWarning-50 text-forgeWarning-800 ring-forgeWarning-500";
  return "bg-forgeSuccess-50 text-forgeSuccess-800 ring-forgeSuccess-500";
}

export function CaseRiskBadge({ profile }: { profile?: RiskProfile | null }) {
  const m = useLegalCasesMessages();
  const [open, setOpen] = useState(false);
  if (!profile) return null;
  const s = profile.overall_risk_score;
  const pct = Math.round(Math.min(1, Math.max(0, s)) * 100);
  return (
    <div className="relative">
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${riskTone(s)}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {m.risk.overall_score}: {pct}%
      </button>
      {open ? (
        <div
          className="absolute right-0 z-20 mt-1 w-72 rounded-forge-sm border border-forgeInk-200 bg-forgeSurface-raised p-3 text-left text-xs shadow-forge-md"
          role="region"
        >
          <p>
            <span className="font-medium text-forgeInk-800">{m.risk.probability_of_loss}:</span>{" "}
            {Math.round(profile.probability_of_loss * 100)}%
          </p>
          {profile.financial_exposure ? (
            <p>
              <span className="font-medium">{m.risk.financial_exposure}:</span> {profile.financial_exposure}
            </p>
          ) : null}
          <p>
            <span className="font-medium">{m.risk.legal_complexity}:</span> {profile.legal_complexity}
          </p>
          <p>
            <span className="font-medium">{m.risk.timeline_risk}:</span> {profile.timeline_risk}
          </p>
        </div>
      ) : null}
    </div>
  );
}
