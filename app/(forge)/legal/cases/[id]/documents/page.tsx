"use client";

import { use, useState } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
import { useCaseDocuments } from "@/hooks/legal/useCaseDocuments";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { CaseDetailHeader } from "@/components/legal/cases/CaseDetailHeader";
import { CaseDocumentsList } from "@/components/legal/cases/CaseDocumentsList";
import { CaseDocumentUploader } from "@/components/legal/cases/CaseDocumentUploader";
import { CaseDocumentLifecycleSelector } from "@/components/legal/cases/CaseDocumentLifecycleSelector";
import { CaseDocumentExtractedDataReview } from "@/components/legal/cases/CaseDocumentExtractedDataReview";
import { DocumentGenerationButton } from "@/components/legal/cases/DocumentGenerationButton";
import { GeneratedDocumentsList } from "@/components/legal/cases/GeneratedDocumentsList";
import { GeneratedDocumentViewer } from "@/components/legal/cases/GeneratedDocumentViewer";
import { LegalDocumentsS3WarningBanner } from "@/components/legal/cases/LegalDocumentsS3WarningBanner";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";
import type { CaseDocument } from "@/lib/legal/cases/case-types";

export default function LegalCaseDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const msgs = useLegalCasesMessages();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error, refetch } = useLegalCase(effectiveTenantId, id);
  const { uploadDocument, uploading } = useCaseDocuments(effectiveTenantId, id);
  const [lifeDoc, setLifeDoc] = useState<CaseDocument | null>(null);
  const [reviewDoc, setReviewDoc] = useState<CaseDocument | null>(null);
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [viewDocId, setViewDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<unknown>(null);

  if (!tenantHydrated) return <p className="text-sm text-forgeGray-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }

  return (
    <main id="main-content" className="min-h-0 space-y-6">
      <LegalDocumentsS3WarningBanner />
      {isLoading ? (
        <p className="text-sm text-forgeGray-500">Cargando expediente…</p>
      ) : error || !c ? (
        <p className="text-sm text-forgeDanger-700">No se pudo cargar el expediente</p>
      ) : (
        <>
          <CaseDetailHeader legalCase={c} />
          <div className="flex flex-wrap items-center gap-3">
            <CaseDocumentUploader
              busy={uploading}
              onFile={async (file) => {
                setUploadError(null);
                const fd = new FormData();
                fd.append("file", file);
                try {
                  await uploadDocument(fd);
                  void refetch();
                } catch (e) {
                  setUploadError(e);
                }
              }}
            />
          </div>
          {uploadError ? (
            <LegalApiErrorPanel title={msgs.documents_page.upload_failed} error={uploadError} />
          ) : null}
          <CaseDocumentsList
            documents={c.documents}
            onSelect={(d) => {
              if (!d.extracted_data_human_verified && d.extracted_data) setReviewDoc(d);
              else setLifeDoc(d);
            }}
          />

          <section
            id="documentos-generados-ia"
            className="scroll-mt-24 space-y-4"
            aria-labelledby="heading-documentos-ia"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="heading-documentos-ia" className="text-lg font-semibold text-forgeGray-900">
                {msgs.generated_documents.title}
              </h2>
              <DocumentGenerationButton
                tenantId={effectiveTenantId}
                caseId={id}
                open={genDialogOpen}
                onOpenChange={setGenDialogOpen}
              />
            </div>
            <GeneratedDocumentsList
              tenantId={effectiveTenantId}
              caseId={id}
              onViewDocument={(docId) => setViewDocId(docId)}
              showCtaWhenEmpty
              onCtaGenerate={() => setGenDialogOpen(true)}
            />
          </section>

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
          <GeneratedDocumentViewer
            tenantId={effectiveTenantId}
            caseId={id}
            docId={viewDocId}
            open={viewDocId !== null}
            onClose={() => setViewDocId(null)}
          />
        </>
      )}
    </main>
  );
}
