"use client";

import type { GeneratedDocumentListItem } from "@/lib/legal/cases/case-types";
import type { LegalGeneratedDocumentType } from "@/lib/legal/cases/case-types";
import { useGeneratedDocuments } from "@/hooks/legal/useDocumentGeneration";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

type Props = {
  tenantId: string;
  caseId: string;
  onViewDocument: (docId: string) => void;
  showCtaWhenEmpty?: boolean;
  onCtaGenerate?: () => void;
};

function badgeClass(idx: number): string {
  const cycle = ["bg-forgeBrand-50 text-forgeBrand-900 ring-forgeBrand-300", "bg-forgeInfo-50 text-forgeGray-900 ring-forgeInfo-400", "bg-forgeAccent-gold/15 text-forgeGray-900 ring-forgeAccent-gold"];
  return cycle[idx % cycle.length];
}

export function GeneratedDocumentsList({
  tenantId,
  caseId,
  onViewDocument,
  showCtaWhenEmpty,
  onCtaGenerate,
}: Props) {
  const msgs = useLegalCasesMessages();
  const m = msgs.generated_documents;
  const types = msgs.generate_document.types;
  const { data, isLoading, isError, refetch } = useGeneratedDocuments(tenantId, caseId);

  if (isLoading) {
    return (
      <p className="text-sm text-forgeGray-500" role="status" aria-live="polite">
        {m.loading}
      </p>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-forge-sm border border-forgeDanger-200 bg-forgeDanger-50 p-3 text-sm text-forgeDanger-900">
        <p>{m.error_load}</p>
        <button
          type="button"
          className="mt-2 text-xs font-medium text-forgeBrand-700 underline"
          onClick={() => void refetch()}
          aria-label={m.retry}
        >
          {m.retry}
        </button>
      </div>
    );
  }

  const list: GeneratedDocumentListItem[] = data?.documents ?? [];

  if (list.length === 0) {
    return (
      <div
        className="rounded-forge-md border border-dashed border-forgeGray-200 bg-forgeSurface-sunken p-8 text-center"
        role="region"
        aria-label={m.title}
      >
        <p className="text-sm text-forgeGray-700">{m.empty}</p>
        {showCtaWhenEmpty && onCtaGenerate ? (
          <button
            type="button"
            className="mt-4 rounded-forge-sm bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-forgeGray-50"
            onClick={onCtaGenerate}
          >
            {m.cta}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="space-y-3" aria-label={m.title}>
      {list.map((d, i) => {
        const slug = (d.document_type ?? "") as LegalGeneratedDocumentType | string;
        const typeLabel =
          slug && slug in types ? (types as Record<string, string>)[slug] : d.document_type ?? "—";
        const dateStr = d.generated_at ? new Date(d.generated_at).toLocaleString("es-DO") : "—";

        return (
          <li
            key={d.document_id}
            className="flex flex-col gap-2 rounded-forge-md border border-forgeGray-100 bg-forgeSurface-card p-4 shadow-forge-xs md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeClass(i)}`}
                >
                  {typeLabel}
                </span>
                <span className="inline-flex rounded-md bg-forgeNeutral-50 px-2 py-0.5 text-xs font-medium text-forgeGray-700 ring-1 ring-forgeNeutral-200">
                  {m.badge_draft}
                </span>
                {!d.attorney_validated ? (
                  <span className="inline-flex rounded-md bg-forgeWarning-50 px-2 py-0.5 text-xs font-medium text-forgeWarning-900 ring-1 ring-forgeWarning-200">
                    {m.badge_pending_validation}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-forgeGray-500">
                {m.generated_at}{" "}
                <time dateTime={d.generated_at}>{dateStr}</time>
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-forge-sm bg-forgeGray-900 px-4 py-2 text-sm font-medium text-forgeGray-50 hover:bg-forgeGray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
              onClick={() => onViewDocument(d.document_id)}
              aria-label={`${m.view}: ${typeLabel}`}
            >
              {m.view}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
