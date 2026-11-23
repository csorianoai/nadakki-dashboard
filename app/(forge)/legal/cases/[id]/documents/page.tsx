"use client";

import { use, useState } from "react";
import { useLegalCase } from "@/hooks/legal/useLegalCase";
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
import type { CaseDocument } from "@/lib/legal/cases/case-types";

/**
 * Solo los documentos subidos llevan datos extraídos que el abogado debe verificar.
 * Un escrito generado por IA guarda su texto en extracted_data (generated_text): antes
 * «Gestionar» abría un formulario de verificación vacío y nunca la revisión del abogado.
 */
function necesitaVerificarDatos(d: CaseDocument): boolean {
  const extra = d.extracted_data;
  if (!extra || d.extracted_data_human_verified) return false;
  if (d.document_subtype === "ai_generated" || "generated_text" in extra) return false;
  return true;
}

export default function LegalCaseDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const msgs = useLegalCasesMessages();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { data: c, isLoading, error, refetch } = useLegalCase(effectiveTenantId, id);
  const [lifeDoc, setLifeDoc] = useState<CaseDocument | null>(null);
  const [reviewDoc, setReviewDoc] = useState<CaseDocument | null>(null);
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [viewDocId, setViewDocId] = useState<string | null>(null);

  if (!tenantHydrated) return <p className="text-sm text-forgeGray-500">Cargando…</p>;
  if (!effectiveTenantId || tenantError) {
    return <p className="text-sm text-forgeDanger-700">{tenantError ?? "Tenant no disponible"}</p>;
  }
  if (isLoading || error || !c) {
    return <p className="text-sm text-forgeGray-500">{isLoading ? "Cargando…" : "Error"}</p>;
  }

  return (
    <main id="main-content" className="min-h-0 space-y-6">
      <CaseDetailHeader legalCase={c} />
      <CaseDocumentUploader tenantId={effectiveTenantId} caseId={id} onUploaded={() => void refetch()} />
      <CaseDocumentsList
        documents={c.documents}
        onSelect={(d) => {
          if (necesitaVerificarDatos(d)) setReviewDoc(d);
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
    </main>
  );
}
