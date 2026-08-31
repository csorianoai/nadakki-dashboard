"use client";

import { cn } from "@/lib/utils";
import { tenantDocumentKey } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { Button, Checkbox, Input, Textarea } from "@/components/forge";
import {
  countCompletePersonalReferences,
  hasRequiredDocumentsFileReady,
  isDocumentSelected,
  missingRequiredDocumentLabels,
  PERSONAL_REFERENCES_MAX,
  PERSONAL_REFERENCES_MIN,
} from "@/lib/credit-hub/dealer/wizard-gates";
import { wizardDocumentOptionalNotice } from "@/lib/credit-hub/dealer/wizard-optional-notices";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useDealerWizard } from "./DealerWizardProvider";
import { DocumentUploadZone } from "./DocumentUploadZone";

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
    toggleDocumentSelected,
    isSubmitting,
    updatePersonalReference,
    addPersonalReference,
    removePersonalReference,
    getFieldError,
    blockReason,
    showValidationErrors,
  } = useDealerWizard();

  const docList = requiredDocumentsList;
  const refsComplete = countCompletePersonalReferences(formData.personal_references);
  const docsReady = hasRequiredDocumentsFileReady(formData);
  const missingRequired = missingRequiredDocumentLabels(formData, docList, tenantDocumentKey);

  const handleOptionalToggle = (key: string, nextChecked: boolean, hasFile: boolean) => {
    if (!nextChecked && hasFile) {
      const confirmed = window.confirm("¿Quitar el archivo adjunto de este documento?");
      if (!confirmed) return;
    }
    toggleDocumentSelected(key, nextChecked);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">{t.wizard.sections.documents_title}</h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">
          Marca los documentos que tengas listos y sube los archivos. Las cargas son opcionales para despachar; si una falla, podrás reintentarlo después.
        </p>
      </div>

      <div className="space-y-3" data-testid="documents-checklist">
        {docList.map((document) => {
          const k = tenantDocumentKey(document);
          const entry = pendingFiles.get(k);
          const hasFile = Boolean(formData.document_files_ready?.[k]);
          const isRequired = document.required;
          const selected = isDocumentSelected(formData, document, tenantDocumentKey);
          const showUpload = isRequired || selected;

          return (
            <div
              key={k}
              className={cn(
                "rounded-forge-md border bg-forgeSurface-sunken p-3",
                getFieldError(`document_${k}`) ? "border-[#ef4444]" : "border-forgeGray-200",
              )}
              data-wizard-field={`document_${k}`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isRequired ? true : selected}
                  disabled={isRequired || isSubmitting}
                  onChange={(e) => handleOptionalToggle(k, e.target.checked, hasFile)}
                  aria-label={document.label}
                  className="mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-forge-sm font-medium text-forgeGray-800">{document.label}</p>
                    {isRequired ? <span className="text-forge-xs text-forgeGray-500">Requerido</span> : (
                      <span className="text-forge-xs text-forgeGray-500">Opcional</span>
                    )}
                  </div>
                  {wizardDocumentOptionalNotice(k) ? (
                    <p className="text-forge-xs text-amber-700/90">{wizardDocumentOptionalNotice(k)}</p>
                  ) : null}
                  {document.tooltip ? <p className="text-forge-xs text-forgeGray-500">{document.tooltip}</p> : null}

                  {showUpload ? (
                    <>
                      <DocumentUploadZone
                        documentKey={k}
                        disabled={isSubmitting}
                        file={entry?.file ?? null}
                        status={entry?.status ?? "idle"}
                        previewUrl={entry?.previewUrl}
                        errorMessage={entry?.errorMessage ?? getFieldError(`document_${k}`)}
                        onFileSelect={setPendingFile}
                      />
                      <Textarea
                        placeholder={t.wizard.doc_notes_placeholder}
                        value={formData.document_notes[k] ?? ""}
                        onChange={(e) => updateDocumentNote(k, e.target.value)}
                        rows={2}
                        className="min-h-12"
                      />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4" data-testid="personal-references-section">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-display text-forge-lg font-semibold text-forgeGray-800">Referencias personales</h3>
            <p className="mt-1 text-forge-sm text-forgeGray-500">
              Mínimo {PERSONAL_REFERENCES_MIN} referencias completas (nombre, dirección y teléfono de 7+ dígitos).
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
            <span className="ml-2 text-forgeGray-600">— Se requieren al menos 3 referencias personales completas</span>
          ) : null}
        </p>
        <div className="space-y-3">
          {formData.personal_references.map((ref, index) => {
            const cardKey = `personal_reference_${index}`;
            const cardError = getFieldError(cardKey);
            return (
            <div
              key={ref.id}
              className={cn(
                "space-y-3 rounded-forge-md border bg-forgeSurface-sunken p-4",
                cardError ? "border-[#ef4444]" : "border-forgeGray-200",
              )}
              data-testid={`personal-reference-${index}`}
              data-wizard-field={cardKey}
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
                fieldKey={`${cardKey}_nombre_completo`}
                value={ref.nombre_completo}
                onChange={(e) => updatePersonalReference(ref.id, { nombre_completo: e.target.value })}
                error={getFieldError(`${cardKey}_nombre_completo`)}
              />
              <Input
                label="Dirección *"
                fieldKey={`${cardKey}_direccion`}
                value={ref.direccion}
                onChange={(e) => updatePersonalReference(ref.id, { direccion: e.target.value })}
                error={getFieldError(`${cardKey}_direccion`)}
              />
              <Input
                label="Teléfono *"
                fieldKey={`${cardKey}_telefono`}
                type="tel"
                value={ref.telefono}
                onChange={(e) => updatePersonalReference(ref.id, { telefono: e.target.value })}
                error={getFieldError(`${cardKey}_telefono`)}
              />
            </div>
          );
          })}
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

      {!docsReady || refsComplete < PERSONAL_REFERENCES_MIN ? (
        <p className="text-forge-sm text-[#ef4444]" role="alert">
          {showValidationErrors && blockReason
            ? blockReason
            : !docsReady && refsComplete < PERSONAL_REFERENCES_MIN
            ? `Sube los documentos obligatorios (${missingRequired.join(", ")}) y completa al menos 3 referencias personales para continuar.`
            : !docsReady
              ? `Sube los documentos obligatorios: ${missingRequired.join(", ")}.`
              : "Se requieren al menos 3 referencias personales completas"}
        </p>
      ) : null}
    </div>
  );
}
