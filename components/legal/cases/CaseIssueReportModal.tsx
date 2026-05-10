"use client";

import { useState } from "react";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { useCaseIssues } from "@/hooks/legal/useCaseIssues";
import type { IssueSeverity } from "@/lib/legal/cases/case-types";

export function CaseIssueReportModal({
  tenantId,
  caseId,
  onClose,
}: {
  tenantId: string;
  caseId: string;
  onClose: () => void;
}) {
  const m = useLegalCasesMessages();
  const { createIssue, mutating } = useCaseIssues(tenantId, caseId);
  const [issueType, setIssueType] = useState("other");
  const [severity, setSeverity] = useState<IssueSeverity>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (title.trim().length < 5) {
      setErr("El título debe tener al menos 5 caracteres");
      return;
    }
    if (description.trim().length < 10) {
      setErr("La descripción debe tener al menos 10 caracteres");
      return;
    }
    try {
      await createIssue({
        issue_type: issueType,
        severity,
        title: title.trim(),
        description: description.trim(),
        detected_by: "attorney",
      });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forgeGray-900/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-6 shadow-forge-md">
        <h2 className="text-lg font-semibold text-forgeGray-900">{m.issues.report_button}</h2>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-forgeGray-800">
            Tipo
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="mt-1 w-full rounded-forge-sm border border-forgeGray-200 px-2 py-2"
            >
              {(Object.keys(m.issues.types) as Array<keyof typeof m.issues.types>).map((k) => (
                <option key={k} value={k}>
                  {m.issues.types[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-forgeGray-800">
            Gravedad
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
              className="mt-1 w-full rounded-forge-sm border border-forgeGray-200 px-2 py-2"
            >
              {(Object.keys(m.issues.severity) as IssueSeverity[]).map((k) => (
                <option key={k} value={k}>
                  {m.issues.severity[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-forgeGray-800">
            Título
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-forge-sm border border-forgeGray-200 px-2 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-forgeGray-800">
            Descripción
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-forge-sm border border-forgeGray-200 px-2 py-2"
            />
          </label>
        </div>
        {err ? (
          <p className="mt-2 text-sm text-forgeDanger-700" role="alert">
            {err}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-forge-sm px-3 py-2 text-sm text-forgeGray-700 ring-1 ring-forgeGray-200" onClick={onClose}>
            {m.actions.cancel}
          </button>
          <button
            type="button"
            disabled={mutating}
            className="rounded-forge-sm bg-forgeBrand-600 px-3 py-2 text-sm font-medium text-forgeGray-50 hover:bg-forgeBrand-700 disabled:opacity-50"
            onClick={() => void submit()}
          >
            {m.actions.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
