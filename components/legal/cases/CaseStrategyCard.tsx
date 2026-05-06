"use client";

import type { CaseStrategy } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export function CaseStrategyCard({ strategy: s }: { strategy: CaseStrategy }) {
  const m = useLegalCasesMessages();
  return (
    <div className="flex-1 text-sm">
      <p className="font-semibold text-forgeInk-900">{s.name}</p>
      <p className="text-forgeInk-600">{s.description}</p>
      <p className="mt-1 text-xs text-forgeInk-500">
        {m.strategy.expected_strength}: {Math.round(s.expected_strength * 100)}%
      </p>
      {s.risks?.length ? (
        <p className="mt-1 text-xs text-forgeWarning-800">
          {m.strategy.risks}: {s.risks.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
