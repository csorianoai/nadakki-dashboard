"use client";

import { useState } from "react";
import type { CaseDeadline } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { daysUntil } from "@/lib/legal/cases/deadline-formatter";
import { CaseDeadlineOverrideModal } from "@/components/legal/cases/CaseDeadlineOverrideModal";

export function CaseDeadlinesPanel({
  deadlines,
  caseId,
  tenantId,
  onOverridden,
}: {
  deadlines: CaseDeadline[];
  caseId: string;
  tenantId: string;
  onOverridden?: () => void;
}) {
  const m = useLegalCasesMessages();
  const [target, setTarget] = useState<CaseDeadline | null>(null);
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-forgeInk-900">{m.deadlines.title}</h2>
      <ul className="space-y-3">
        {(deadlines ?? []).map((d) => {
          const days = daysUntil(d.effective_deadline_date);
          return (
            <li
              key={d.deadline_id}
              className="rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-forgeInk-900">{d.deadline_db_id}</p>
                  <p className="text-xs text-forgeInk-600">{d.legal_basis}</p>
                  <p className="mt-1 text-xs text-forgeInk-500">
                    {d.has_human_override ? m.deadlines.human_override : m.deadlines.auto_calculated}:{" "}
                    {d.effective_deadline_date}
                  </p>
                  <p className={`text-xs font-medium ${days < 0 ? "text-forgeDanger-700" : "text-forgeInk-700"}`}>
                    {days < 0 ? m.deadlines.expired : m.deadlines.days_remaining.replace("{days}", String(days))}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-forge-sm bg-forgeBrand-600 px-2 py-1 text-xs font-medium text-forgeInk-50 hover:bg-forgeBrand-700"
                  onClick={() => setTarget(d)}
                >
                  {m.deadlines.override}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {target ? (
        <CaseDeadlineOverrideModal
          deadline={target}
          caseId={caseId}
          tenantId={tenantId}
          onClose={() => setTarget(null)}
          onSuccess={() => {
            setTarget(null);
            onOverridden?.();
          }}
        />
      ) : null}
    </div>
  );
}
