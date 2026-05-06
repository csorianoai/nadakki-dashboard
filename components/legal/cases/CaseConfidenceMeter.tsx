"use client";

import type { CaseConfidence } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export function CaseConfidenceMeter({ confidence }: { confidence?: CaseConfidence | null }) {
  const m = useLegalCasesMessages();
  if (!confidence) return null;
  const pct = Math.round(Math.min(1, Math.max(0, confidence.overall_score)) * 100);
  const factorLines = Object.entries(confidence.factors ?? {}).map(([k, v]) => (
    <li key={k}>
      {(m.confidence.factors as Record<string, string>)[k] ?? k}: {Math.round(v * 100)}%
    </li>
  ));
  return (
    <div className="rounded-forge-sm border border-forgeInk-200 bg-forgeSurface-card p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-forgeInk-800">{m.confidence.title}</span>
        <span className="text-sm font-semibold text-forgeBrand-700">{pct}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-forgeInk-100"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={m.confidence.title}
      >
        <div
          className="h-full rounded-full bg-forgeBrand-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {factorLines.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-forgeInk-600">{factorLines}</ul>
      ) : null}
    </div>
  );
}
