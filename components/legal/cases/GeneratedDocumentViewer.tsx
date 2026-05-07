"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGeneratedDocument } from "@/hooks/legal/useDocumentGeneration";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { toast } from "@/components/forge/ui/Toast";
import type { LegalGeneratedDocumentType } from "@/lib/legal/cases/case-types";

type Props = {
  tenantId: string;
  caseId: string;
  docId: string | null;
  open: boolean;
  onClose: () => void;
};

function renderCitations(citations: unknown, heading: string): ReactNode {
  if (citations === null || citations === undefined) return null;
  if (typeof citations === "string") {
    return (
      <div className="mt-6 rounded-forge-md border border-forgeInk-200 bg-forgeSurface-sunken p-4">
        <h3 className="text-sm font-semibold text-forgeInk-900">{heading}</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-forgeInk-700">{citations}</p>
      </div>
    );
  }
  if (Array.isArray(citations)) {
    return (
      <div className="mt-6 rounded-forge-md border border-forgeInk-200 bg-forgeSurface-sunken p-4">
        <h3 id="generated-doc-citations" className="text-sm font-semibold text-forgeInk-900">
          {heading}
        </h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-forgeInk-700" aria-labelledby="generated-doc-citations">
          {citations.map((item, idx) => (
            <li key={typeof item === "string" ? item : idx}>
              {typeof item === "string" || typeof item === "number"
                ? String(item)
                : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-forge-md border border-forgeInk-200 bg-forgeSurface-sunken p-4">
      <h3 className="text-sm font-semibold text-forgeInk-900">{heading}</h3>
      <pre className="mt-2 max-h-48 overflow-auto rounded-forge-sm bg-forgeInk-900/5 p-3 font-mono text-xs text-forgeInk-800">
        {JSON.stringify(citations, null, 2)}
      </pre>
    </div>
  );
}

export function GeneratedDocumentViewer({ tenantId, caseId, docId, open, onClose }: Props) {
  const msgs = useLegalCasesMessages();
  const mGen = msgs.generate_document;
  const mList = msgs.generated_documents;
  const typeLabels = mGen.types;
  const { data, isLoading, isError, refetch } = useGeneratedDocument(
    tenantId,
    caseId,
    open && docId ? docId : undefined
  );

  if (!open) return null;
  if (!docId?.trim()) return null;

  const slug = (data?.document_type ?? "") as LegalGeneratedDocumentType | string;
  const typeLabel =
    slug && slug in typeLabels ? (typeLabels as Record<string, string>)[slug] : data?.document_type ?? "—";

  const copyContent = async () => {
    const text = data?.content ?? "";
    if (!text) {
      toast.error(mList.copy_no_content);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(mGen.copied);
    } catch {
      toast.error(mGen.error_generate);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-forgeInk-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generated-doc-viewer-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card shadow-forge-lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-forgeInk-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="generated-doc-viewer-title" className="truncate text-lg font-semibold text-forgeInk-900">
              {mList.open_details}
            </h2>
            <p className="mt-1 text-xs text-forgeInk-600">
              <span className="font-medium text-forgeInk-800">{mList.type_label}:</span> {typeLabel}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-forge-sm px-3 py-1.5 text-sm text-forgeInk-700 ring-1 ring-forgeInk-200 hover:bg-forgeSurface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
            onClick={onClose}
            aria-label={mList.viewer_close}
          >
            {mList.viewer_close}
          </button>
        </div>

        <div
          data-forge-warning="ia-documento-legal"
          className="shrink-0 border-b border-forgeWarning-200 bg-forgeWarning-50 px-5 py-3 text-sm text-forgeWarning-950"
          role="status"
        >
          {mGen.warning_banner}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <p className="text-sm text-forgeInk-500" role="status" aria-live="polite">
              {mList.viewer_loading}
            </p>
          ) : null}

          {isError ? (
            <div role="alert" className="rounded-forge-sm border border-forgeDanger-200 bg-forgeDanger-50 p-3 text-sm text-forgeDanger-900">
              <p>{mList.viewer_error}</p>
              <button
                type="button"
                className="mt-2 text-xs font-medium text-forgeBrand-700 underline"
                onClick={() => void refetch()}
                aria-label={mList.viewer_retry}
              >
                {mList.viewer_retry}
              </button>
            </div>
          ) : null}

          {!isLoading && !isError && data ? (
            <>
              <dl className="mb-4 grid gap-2 text-xs text-forgeInk-600 sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-forgeInk-700">{mList.generated_at}</dt>
                  <dd>
                    {data.generated_at ? (
                      <time dateTime={data.generated_at}>
                        {new Date(data.generated_at).toLocaleString("es-DO")}
                      </time>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-forgeInk-700">{mGen.metadata_validation}</dt>
                  <dd>
                    {data.attorney_validated ? mGen.metadata_validation_yes : mGen.metadata_validation_no}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 border-b border-forgeInk-100 pb-4">
                <button
                  type="button"
                  className="inline-flex rounded-forge-sm bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-forgeInk-50 hover:bg-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500 disabled:opacity-50"
                  onClick={() => void copyContent()}
                  disabled={!data.content}
                  aria-label={mGen.copy}
                >
                  {mGen.copy}
                </button>
                <button
                  type="button"
                  className="inline-flex rounded-forge-sm px-4 py-2 text-sm text-forgeInk-500 ring-1 ring-forgeInk-200"
                  disabled
                  title={mGen.mark_validated_disabled}
                  aria-label={mGen.mark_validated_placeholder}
                >
                  {mGen.mark_validated_placeholder}
                </button>
              </div>

              <div
                className="max-w-none pt-4 text-sm leading-relaxed text-forgeInk-900 [&_a]:text-forgeBrand-700 [&_a]:underline [&_code]:rounded-forge-sm [&_code]:bg-forgeNeutral-100 [&_code]:px-1 [&_code]:text-forgeInk-900 [&_h1]:my-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:my-3 [&_h2]:text-base [&_h2]:font-semibold [&_li]:my-1 [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-4"
              >
                {data.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content}</ReactMarkdown>
                ) : (
                  <p className="text-sm text-forgeInk-500">{mList.empty}</p>
                )}
              </div>

              {renderCitations(data.citations, mGen.citations_heading)}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
