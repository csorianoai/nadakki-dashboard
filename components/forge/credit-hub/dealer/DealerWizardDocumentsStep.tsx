"use client";

import { tenantDocumentKey } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { Button, Checkbox, Input, Textarea } from "@/components/forge";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useDealerWizard } from "./DealerWizardProvider";
import { DocumentUploadZone } from "./DocumentUploadZone";

function isFilled(value: string): boolean {
  return value.trim().length > 0;
}

export function DealerWizardDocumentsStep() {
  const t = useTranslations();
  const {
    formData,
    updateDocumentReceived,
    updateDocumentNote,
    addAdditionalDocumentRow,
    updateAdditionalDocumentRow,
    removeAdditionalDocumentRow,
    requiredDocumentsList,
    pendingFiles,
    setPendingFile,
    isSubmitting,
    showValidationErrors,
    fieldErrors,
  } = useDealerWizard();

  const docList = requiredDocumentsList;
  const checklistReceived = docList.filter((d) => Boolean(formData.documents_received[tenantDocumentKey(d)])).length;
  const extraReceived = formData.additional_document_items.filter((r) => r.received && isFilled(r.label)).length;
  const receivedCount = checklistReceived + extraReceived;
  const totalCount = docList.length + formData.additional_document_items.filter((r) => isFilled(r.label)).length;
  const requiredMissing = docList.filter((d) => d.required).filter((d) => !formData.documents_received[tenantDocumentKey(d)]).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">{t.wizard.sections.documents_title}</h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">{t.wizard.sections.documents_sub}</p>
      </div>
      <p className="text-forge-sm text-forgeGray-500">
        {t.documents.counter(receivedCount, Math.max(totalCount, docList.length))}
        {requiredMissing > 0 ? <span className="ml-2 text-forgeDanger-600">({t.documents.missing_required(requiredMissing)})</span> : null}
      </p>
      <div className="space-y-3" data-testid="documents-checklist">
        {docList.map((document) => {
          const k = tenantDocumentKey(document);
          const checked = Boolean(formData.documents_received[k]);
          const entry = pendingFiles.get(k);
          const docErrorKey = `doc_${k}`;
          const hasDocError = showValidationErrors && Boolean(fieldErrors[docErrorKey]);
          return (
            <div
              key={k}
              className={cn(
                "flex flex-col gap-2 rounded-forge-md border bg-forgeSurface-sunken p-3",
                hasDocError ? "border-forgeDanger-500" : "border-forgeGray-200"
              )}
              aria-invalid={hasDocError || undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <Checkbox
                  label={`${document.label}${document.required ? " *" : ` (${t.common.optional_short})`}`}
                  checked={checked}
                  onChange={(e) => {
                    updateDocumentReceived(k, e.target.checked);
                    // If unchecking and there's a file, remove it too
                    if (!e.target.checked && entry) {
                      setPendingFile(k, null);
                    }
                  }}
                  className="items-start"
                />
                <span className={`shrink-0 text-forge-xs tabular-nums ${checked ? "text-forgeSuccess-700" : "text-forgeGray-400"}`}>
                  {checked ? t.documents.received : t.documents.pending}
                </span>
              </div>
              {document.tooltip ? <p className="text-forge-xs text-forgeGray-500">{document.tooltip}</p> : null}
              {hasDocError ? <p className="text-forge-xs text-forgeDanger-500">{fieldErrors[docErrorKey]}</p> : null}

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
      <p className="text-forge-xs text-forgeGray-400">
        Los archivos se subirán automáticamente al enviar la solicitud. También puede marcar documentos como recibidos sin subir archivo si los tiene en físico.
      </p>
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
            <Checkbox
              label={t.wizard.doc_received_label}
              checked={row.received}
              onChange={(e) => updateAdditionalDocumentRow(row.id, { received: e.target.checked })}
              className="pb-2"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeAdditionalDocumentRow(row.id)} aria-label={t.common.delete_additional_doc_aria}>
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
