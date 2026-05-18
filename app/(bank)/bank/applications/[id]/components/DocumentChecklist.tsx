"use client";

import type { BankApplicationDocument } from "@/lib/bank-application-detail/types";

export interface DocumentChecklistProps {
  documents: BankApplicationDocument[] | undefined;
}

export function DocumentChecklist({ documents }: DocumentChecklistProps) {
  const rows = documents?.length ? documents : [];

  return (
    <section
      className="rounded-xl border border-forgeGray-200 bg-white p-6 shadow-sm"
      aria-labelledby="documents-section-title"
    >
      <h2 id="documents-section-title" className="text-lg font-semibold text-forgeGray-900">
        Documentos
      </h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-forge-sm text-forgeGray-600">No hay documentos listados para esta solicitud.</p>
      ) : (
        <ul className="mt-4 divide-y divide-forgeGray-100 rounded-lg border border-forgeGray-100">
          {rows.map((doc, i) => (
            <li key={doc.id ?? `doc-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="font-medium text-forgeGray-900">{doc.name ?? doc.type ?? "Documento"}</span>
              <span className="rounded-full bg-forgeGray-100 px-2 py-0.5 text-forge-xs uppercase text-forgeGray-700">
                {doc.status ?? "pendiente"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
