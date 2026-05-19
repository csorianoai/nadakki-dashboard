"use client";

import { useEffect, useMemo } from "react";

import type { BankApplicationDocument } from "@/lib/bank-application-detail/types";
import { warmThumbnailCache } from "@/lib/bank/document-preview-api";

export interface DocumentChecklistProps {
  documents: BankApplicationDocument[] | undefined;
  applicationId?: string;
  tenantId?: string;
  previewEnabled?: boolean;
  authToken?: string;
  onOpenPreview?: (docId: string, label: string) => void;
}

export function DocumentChecklist({
  documents,
  applicationId,
  tenantId,
  previewEnabled,
  authToken,
  onOpenPreview,
}: DocumentChecklistProps) {
  const rows = documents?.length ? documents : [];
  const rowsWithIds = useMemo(() => rows.filter((doc) => doc.id), [rows]);

  useEffect(() => {
    if (!previewEnabled || !applicationId?.trim() || !tenantId?.trim()) return undefined;
    const controller = new AbortController();
    const slice = rowsWithIds.slice(0, 10);
    for (const doc of slice) {
      if (!doc.id) continue;
      void warmThumbnailCache(applicationId, doc.id, tenantId, {
        authToken,
        page: 1,
        signal: controller.signal,
      }).catch(() => undefined);
    }
    return () => controller.abort();
  }, [applicationId, authToken, previewEnabled, rowsWithIds, tenantId]);

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
          {rows.map((doc, i) => {
            const docId = doc.id;
            const key = docId ?? `${doc.type ?? "documento"}-${i}`;
            const showPreviewBtn = previewEnabled && applicationId?.trim() && tenantId?.trim() && docId && onOpenPreview;
            const label = doc.name ?? doc.type ?? "Documento";
            return (
              <li
                key={key}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                data-testid="document-checklist-row"
              >
                <span className="font-medium text-forgeGray-900">{label}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {showPreviewBtn ? (
                    <button
                      type="button"
                      className="rounded-md border border-forgeBrand-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-forgeBrand-800 hover:bg-forgeBrand-50"
                      data-document-id={docId}
                      onClick={() => onOpenPreview(docId!, label)}
                    >
                      Vista previa
                    </button>
                  ) : null}
                  <span className="rounded-full bg-forgeGray-100 px-2 py-0.5 text-forge-xs uppercase text-forgeGray-700">
                    {doc.status ?? "pendiente"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
