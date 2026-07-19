"use client";

import { useState } from "react";
import type { CaseDocument } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { useCaseDocumentLifecycle } from "@/hooks/legal/useCaseDocumentLifecycle";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";

export function CaseDocumentExtractedDataReview({
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
  const { verifyExtracted, pending } = useCaseDocumentLifecycle(tenantId, caseId);
  const [json, setJson] = useState(JSON.stringify(doc.extracted_data ?? {}, null, 2));
  const [error, setError] = useState<unknown>(null);

  const confirm = async (mode: "as_is" | "corrections") => {
    setError(null);
    try {
      if (mode === "as_is") {
        await verifyExtracted({
          docId: doc.document_id,
          body: { verified: true },
        });
      } else {
        const corrections = JSON.parse(json) as Record<string, unknown>;
        await verifyExtracted({
          docId: doc.document_id,
          body: { verified: true, corrections },
        });
      }
      onClose();
    } catch (e) {
      setError(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forgeGray-900/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-6 shadow-forge-md">
        <h2 className="text-lg font-semibold text-forgeGray-900">{m.documents.extracted_data_review.title}</h2>
        <p className="mt-2 text-sm text-forgeWarning-800">{m.documents.extracted_data_review.warning}</p>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={12}
          className="mt-4 w-full rounded-forge-sm border border-forgeGray-200 font-mono text-xs"
          aria-label="Datos extraídos"
        />
        {error ? (
          <div className="mt-4">
            <LegalApiErrorPanel
              title="Verificación de datos extraídos no disponible"
              error={error}
            />
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="rounded-forge-sm px-3 py-2 text-sm ring-1 ring-forgeGray-200" onClick={onClose}>
            {m.actions.cancel}
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-forge-sm bg-forgeSurface-raised px-3 py-2 text-sm font-medium text-forgeGray-800 ring-1 ring-forgeGray-200"
            onClick={() => void confirm("as_is")}
          >
            {m.documents.extracted_data_review.confirm_as_is}
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-forge-sm bg-forgeBrand-600 px-3 py-2 text-sm font-medium text-forgeGray-50"
            onClick={() => void confirm("corrections")}
          >
            {m.documents.extracted_data_review.save_corrections}
          </button>
        </div>
      </div>
    </div>
  );
}
