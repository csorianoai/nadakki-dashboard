"use client";

import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

/** Banner S3 — persistencia documentos no garantizada (deuda backend). Siempre visible en Documentos. */
export function LegalDocumentsS3WarningBanner() {
  const m = useLegalCasesMessages();
  return (
    <div
      className="sticky top-16 z-20 rounded-forge-md border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
      role="alert"
      data-testid="legal-documents-s3-warning"
    >
      {m.documents_page.s3_warning}
    </div>
  );
}
