"use client";

import { useMemo, useState } from "react";
import type { CaseIssue, IssueSeverity } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export function CaseIssuesPanel({
  issues,
  onReport,
}: {
  issues: CaseIssue[];
  onReport: () => void;
}) {
  const m = useLegalCasesMessages();
  const [sev, setSev] = useState<IssueSeverity | "">("");
  const filtered = useMemo(() => {
    if (!sev) return issues;
    return issues.filter((i) => i.severity === sev);
  }, [issues, sev]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-forgeInk-900">{m.issues.title}</h2>
        <button
          type="button"
          className="rounded-forge-sm bg-forgeBrand-600 px-3 py-1.5 text-xs font-medium text-forgeInk-50"
          onClick={onReport}
        >
          {m.issues.report_button}
        </button>
      </div>
      <label className="mb-3 block text-xs font-medium text-forgeInk-600">
        Filtrar por gravedad
        <select
          value={sev}
          onChange={(e) => setSev(e.target.value as IssueSeverity | "")}
          className="ml-2 rounded-forge-sm border border-forgeInk-200 px-2 py-1"
        >
          <option value="">Todas</option>
          {(Object.keys(m.issues.severity) as IssueSeverity[]).map((k) => (
            <option key={k} value={k}>
              {m.issues.severity[k]}
            </option>
          ))}
        </select>
      </label>
      {!filtered.length ? (
        <p className="text-sm text-forgeInk-500">{m.issues.none}</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((i) => (
            <li key={i.issue_id} className="rounded-forge-md border border-forgeInk-200 p-3 text-sm">
              <p className="font-medium text-forgeInk-900">{i.title}</p>
              <p className="text-xs text-forgeInk-600">{m.issues.severity[i.severity]} · {i.status}</p>
              <p className="mt-1 text-forgeInk-700">{i.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
