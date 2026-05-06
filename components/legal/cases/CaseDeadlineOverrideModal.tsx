"use client";

import { useState } from "react";
import type { CaseDeadline } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { useCaseDeadlines } from "@/hooks/legal/useCaseDeadlines";

export function CaseDeadlineOverrideModal({
  deadline,
  caseId,
  tenantId,
  onClose,
  onSuccess,
}: {
  deadline: CaseDeadline;
  caseId: string;
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const m = useLegalCasesMessages();
  const { overrideDeadline, overriding } = useCaseDeadlines(tenantId, caseId);
  const [newDate, setNewDate] = useState(deadline.effective_deadline_date);
  const [reason, setReason] = useState("");
  const [legalBasis, setLegalBasis] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (reason.trim().length < 10) {
      setErr("La razón debe tener al menos 10 caracteres");
      return;
    }
    if (legalBasis.trim().length < 5) {
      setErr("La base legal debe tener al menos 5 caracteres");
      return;
    }
    try {
      await overrideDeadline({
        deadlineId: deadline.deadline_id,
        new_deadline_date: newDate,
        reason: reason.trim(),
        legal_basis: legalBasis.trim(),
      });
      onSuccess();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forgeInk-900/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-6 shadow-forge-md">
        <h2 className="text-lg font-semibold text-forgeInk-900">{m.deadlines.override_modal.title}</h2>
        <p className="mt-2 text-sm text-forgeWarning-800">{m.deadlines.override_modal.warning}</p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-forgeInk-800">
            {m.deadlines.override_modal.new_date}
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mt-1 w-full rounded-forge-sm border border-forgeInk-200 px-2 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-forgeInk-800">
            {m.deadlines.override_modal.reason}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-forge-sm border border-forgeInk-200 px-2 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-forgeInk-800">
            {m.deadlines.override_modal.legal_basis}
            <input
              value={legalBasis}
              onChange={(e) => setLegalBasis(e.target.value)}
              className="mt-1 w-full rounded-forge-sm border border-forgeInk-200 px-2 py-2"
            />
          </label>
        </div>
        {err ? (
          <p className="mt-2 text-sm text-forgeDanger-700" role="alert">
            {err}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-forge-sm px-3 py-2 text-sm text-forgeInk-700 ring-1 ring-forgeInk-200" onClick={onClose}>
            {m.actions.cancel}
          </button>
          <button
            type="button"
            disabled={overriding}
            className="rounded-forge-sm bg-forgeBrand-600 px-3 py-2 text-sm font-medium text-forgeInk-50 hover:bg-forgeBrand-700 disabled:opacity-50"
            onClick={() => void submit()}
          >
            {m.actions.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
