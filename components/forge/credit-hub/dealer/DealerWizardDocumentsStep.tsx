"use client";

import { tenantDocumentKey } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { Button, Input, Textarea } from "@/components/forge";
import {
  countCompletePersonalReferences,
  PERSONAL_REFERENCES_MAX,
  PERSONAL_REFERENCES_MIN,
} from "@/lib/credit-hub/dealer/wizard-gates";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useDealerWizard } from "./DealerWizardProvider";
import { DocumentUploadZone } from "./DocumentUploadZone";

function PendingBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: "#fff",
        background: "var(--ch-danger, #dc2626)",
      }}
    >
      PENDIENTE
    </span>
  );
}

export function DealerWizardDocumentsStep() {
  const t = useTranslations();
  const {
    formData,
    updateDocumentNote,
    addAdditionalDocumentRow,
    updateAdditionalDocumentRow,
    removeAdditionalDocumentRow,
    requiredDocumentsList,
    pendingFiles,
    setPendingFile,
    isSubmitting,
    updatePersonalReference,
    addPersonalReference,
    removePersonalReference,
  } = useDealerWizard();

  const docList = requiredDocumentsList;
  const refsComplete = countCompletePersonalReferences(formData.personal_references);
  const idFrontReady = Boolean(formData.document_files_ready?.id_front);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">{t.wizard.sections.documents_title}</h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">
          Solo la cédula (frente) es obligatoria para continuar. Los demás documentos pueden completarse después.
        </p>
      </div>

      <div className="space-y-3" data-testid="documents-checklist">
        {docList.map((document) => {
          const k = tenantDocumentKey(document);
          const entry = pendingFiles.get(k);
          const hasFile = Boolean(formData.document_files_ready?.[k]);
          const isRequired = document.required;
          return (
            <div key={k} className="flex flex-col gap-2 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-forge-sm font-medium text-forgeGray-800">
                  {document.label}
                  {isRequired ? " *" : null}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  {!isRequired && !hasFile ? <PendingBadge /> : null}
                  {hasFile ? (
                    <span className="text-forge-xs font-medium text-forgeSuccess-700">{t.documents.received}</span>
                  ) : isRequired ? (
                    <span className="text-forge-xs text-forgeDanger-600">Obligatorio</span>
                  ) : null}
                </div>
              </div>
              {document.tooltip ? <p className="text-forge-xs text-forgeGray-500">{document.tooltip}</p> : null}

              <DocumentUploadZone
                documentKey={k}
                disabled={isSubmitting}
                file={entry?.file ?? null}
                status={entry?.status ?? "idle"}
                previewUrl={entry?.previewUrl}
                errorMessage={entry?.errorMessage}
                onFileSelect={setPendingFile}
              />

              <Textarea
                placeholder={t.wizard.doc_notes_placeholder}
                value={formData.document_notes[k] ?? ""}
                onChange={(e) => updateDocumentNote(k, e.target.value)}
                rows={2}
                className="min-h-12"
              />
            </div>
          );
        })}
      </div>

      <div className="space-y-4" data-testid="personal-references-section">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-display text-forge-lg font-semibold text-forgeGray-800">Referencias personales</h3>
            <p className="mt-1 text-forge-sm text-forgeGray-500">
              Mínimo {PERSONAL_REFERENCES_MIN} referencias completas (nombre, dirección y teléfono de 10+ dígitos).
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addPersonalReference}
            disabled={formData.personal_references.length >= PERSONAL_REFERENCES_MAX}
          >
            + Agregar referencia
          </Button>
        </div>
        <p className="text-forge-xs text-forgeGray-500">
          {refsComplete} de {PERSONAL_REFERENCES_MIN} referencias completas
          {refsComplete < PERSONAL_REFERENCES_MIN ? (
            <span className="ml-2 text-forgeDanger-600">— Se requieren al menos 3 referencias personales completas</span>
          ) : null}
        </p>
        <div className="space-y-3">
          {formData.personal_references.map((ref, index) => (
            <div
              key={ref.id}
              className="space-y-3 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-4"
              data-testid={`personal-reference-${index}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-forge-sm font-semibold text-forgeGray-800">Referencia {index + 1}</p>
                {formData.personal_references.length > PERSONAL_REFERENCES_MIN ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePersonalReference(ref.id)}>
                    Eliminar
                  </Button>
                ) : null}
              </div>
              <Input
                label="Nombre completo *"
                value={ref.nombre_completo}
                onChange={(e) => updatePersonalReference(ref.id, { nombre_completo: e.target.value })}
              />
              <Input
                label="Dirección *"
                value={ref.direccion}
                onChange={(e) => updatePersonalReference(ref.id, { direccion: e.target.value })}
              />
              <Input
                label="Teléfono *"
                type="tel"
                value={ref.telefono}
                onChange={(e) => updatePersonalReference(ref.id, { telefono: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-forge-sm font-medium text-forgeGray-800">{t.wizard.additional_docs_title}</h4>
        <Button type="button" variant="secondary" size="sm" onClick={addAdditionalDocumentRow}>
          {t.wizard.add_additional_doc}
        </Button>
        {formData.additional_document_items.map((row) => (
          <div key={row.id} className="flex flex-wrap items-end gap-2 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-3">
            <div className="min-w-[12rem] flex-1">
              <Input
                label={t.wizard.additional_doc_label}
                value={row.label}
                onChange={(e) => updateAdditionalDocumentRow(row.id, { label: e.target.value })}
              />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeAdditionalDocumentRow(row.id)} aria-label={t.common.delete_additional_doc_aria}>
              ×
            </Button>
          </div>
        ))}
      </div>

      {!idFrontReady || refsComplete < PERSONAL_REFERENCES_MIN ? (
        <p className="text-forge-sm text-forgeDanger-600" role="status">
          {!idFrontReady && refsComplete < PERSONAL_REFERENCES_MIN
            ? "Sube la cédula (frente) y completa al menos 3 referencias personales para continuar."
            : !idFrontReady
              ? "Sube la foto de la cédula (frente) para continuar."
              : "Se requieren al menos 3 referencias personales completas"}
        </p>
      ) : null}
    </div>
  );
}
