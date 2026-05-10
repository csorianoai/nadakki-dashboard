"use client";

import { useState } from "react";
import type { CaseDocument, DocumentLifecycleStatus } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { useCaseDocumentLifecycle } from "@/hooks/legal/useCaseDocumentLifecycle";

export function CaseDocumentLifecycleSelector({
  doc,
  tenantId,
  caseId,
  onClose,
}: {
  doc: CaseDocument;
  tenantId: string;
  caseId: string;
  onClose: () => void;
}) {
  const m = useLegalCasesMessages();
  const { transitionLifecycle, pending } = useCaseDocumentLifecycle(tenantId, caseId);
  const [status, setStatus] = useState<DocumentLifecycleStatus>(doc.lifecycle_status);
  const [notes, setNotes] = useState("");

  const save = async () => {
    await transitionLifecycle({ docId: doc.document_id, new_status: status, notes: notes || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forgeGray-900/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-6 shadow-forge-md">
        <h2 className="text-lg font-semibold text-forgeGray-900">{doc.title}</h2>
        <label className="mt-4 block text-sm font-medium text-forgeGray-800">
          Estado del documento
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DocumentLifecycleStatus)}
            className="mt-1 w-full rounded-forge-sm border border-forgeGray-200 px-2 py-2"
          >
            {(Object.keys(m.documents.lifecycle) as DocumentLifecycleStatus[]).map((k) => (
              <option key={k} value={k}>
                {m.documents.lifecycle[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm font-medium text-forgeGray-800">
          Notas
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-forge-sm border px-2 py-2" />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-forge-sm px-3 py-2 text-sm ring-1 ring-forgeGray-200" onClick={onClose}>
            {m.actions.cancel}
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-forge-sm bg-forgeBrand-600 px-3 py-2 text-sm font-medium text-forgeGray-50 disabled:opacity-50"
            onClick={() => void save()}
          >
            {m.actions.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
