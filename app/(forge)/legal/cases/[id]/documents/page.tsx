"use client";

import { use, useState } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useCaseDocuments } from "@/hooks/legal/useCaseDocuments";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { CaseDocumentsList } from "@/components/legal/cases/CaseDocumentsList";
import { CaseDocumentUploader } from "@/components/legal/cases/CaseDocumentUploader";
import { CaseDocumentLifecycleSelector } from "@/components/legal/cases/CaseDocumentLifecycleSelector";
import { CaseDocumentExtractedDataReview } from "@/components/legal/cases/CaseDocumentExtractedDataReview";
import type { CaseDocument } from "@/lib/legal/cases/case-types";

export default function LegalCaseDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error, refetch } = useLegalCase(effectiveTenantId, id);
  const { uploadDocument, uploading } = useCaseDocuments(effectiveTenantId, id);
  const [lifeDoc, setLifeDoc] = useState<CaseDocument | null>(null);
  const [reviewDoc, setReviewDoc] = useState<CaseDocument | null>(null);

  if (!tenantHydrated) return <p className="text-sm text-forgeInk-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }
  if (isLoading || error || !c) {
    return <p className="text-sm text-forgeInk-500">{isLoading ? "Cargando…" : "Error"}</p>;
  }

  return (
    <main id="main-content" className="min-h-0 space-y-6">
      <CaseDetailHeader legalCase={c} />
      <div className="flex flex-wrap items-center gap-3">
        <CaseDocumentUploader
          busy={uploading}
          onFile={async (file) => {
            const fd = new FormData();
            fd.append("file", file);
            await uploadDocument(fd);
            void refetch();
          }}
        />
      </div>
      <CaseDocumentsList
        documents={c.documents}
        onSelect={(d) => {
          if (!d.extracted_data_human_verified && d.extracted_data) setReviewDoc(d);
          else setLifeDoc(d);
        }}
      />
      {lifeDoc && effectiveTenantId ? (
        <CaseDocumentLifecycleSelector
          doc={lifeDoc}
          tenantId={effectiveTenantId}
          caseId={id}
          onClose={() => {
            setLifeDoc(null);
            void refetch();
          }}
        />
      ) : null}
      {reviewDoc && effectiveTenantId ? (
        <CaseDocumentExtractedDataReview
          doc={reviewDoc}
          tenantId={effectiveTenantId}
          caseId={id}
          onClose={() => {
            setReviewDoc(null);
            void refetch();
          }}
        />
      ) : null}
    </main>
  );
}
