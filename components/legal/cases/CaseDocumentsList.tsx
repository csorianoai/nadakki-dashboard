"use client";

import type { CaseDocument, DocumentLifecycleStatus } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

export function CaseDocumentsList({
  documents,
  onSelect,
}: {
  documents: CaseDocument[];
  onSelect?: (doc: CaseDocument) => void;
}) {
  const m = useLegalCasesMessages();
  if (!documents.length) {
    return <p className="text-sm text-forgeInk-500">{m.documents.none}</p>;
  }
  return (
    <ul className="divide-y divide-forgeInk-100 rounded-forge-md border border-forgeInk-200">
      {documents.map((d) => {
        const life = m.documents.lifecycle[d.lifecycle_status as DocumentLifecycleStatus] ?? d.lifecycle_status;
        return (
          <li key={d.document_id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
            <div>
              <p className="text-sm font-medium text-forgeInk-900">{d.title}</p>
              <p className="text-xs text-forgeInk-500">
                {d.document_type} · {life}
              </p>
            </div>
            {onSelect ? (
              <button
                type="button"
                className="text-xs font-medium text-forgeBrand-700 hover:underline"
                onClick={() => onSelect(d)}
              >
                Gestionar
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
