"use client";

import { useState } from "react";
import type { LegalGeneratedDocumentType } from "@/lib/legal/cases/case-types";
import { LEGAL_GENERATED_DOCUMENT_TYPES } from "@/lib/legal/cases/case-types";
import { useGenerateDocument } from "@/hooks/legal/useDocumentGeneration";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { toast } from "@/components/forge/ui/Toast";

type Props = {
  tenantId: string;
  caseId: string;
  open: boolean;
  onClose: () => void;
};

export function DocumentGenerationDialog({ tenantId, caseId, open, onClose }: Props) {
  const m = useLegalCasesMessages().generate_document;
  const typeLabels = m.types;
  const { mutateAsync, isPending } = useGenerateDocument(tenantId, caseId);
  const [docType, setDocType] = useState<LegalGeneratedDocumentType>("demanda_civil_cobro_pesos");
  const [instructions, setInstructions] = useState("");
  const [jsonExtra, setJsonExtra] = useState("");

  if (!open) return null;

  const submit = async () => {
    const trimmed = instructions.trim();
    if (!trimmed) {
      toast.error(m.error_instructions);
      return;
    }
    let extra: Record<string, unknown> = {};
    if (jsonExtra.trim()) {
      try {
        extra = JSON.parse(jsonExtra.trim()) as Record<string, unknown>;
        if (!extra || typeof extra !== "object" || Array.isArray(extra)) {
          toast.error(m.error_json);
          return;
        }
      } catch {
        toast.error(m.error_json);
        return;
      }
    }
    const parameters: Record<string, unknown> = { instrucciones: trimmed, ...extra };
    try {
      await mutateAsync({ document_type: docType, parameters });
      toast.success(m.success);
      setInstructions("");
      setJsonExtra("");
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : m.error_generate;
      toast.error(msg);
    }
  };

  return (
    <div
      id="legal-generate-doc-dialog"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-forgeGray-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-doc-heading"
      aria-busy={isPending}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-6 shadow-forge-lg">
        <h2 id="generate-doc-heading" className="text-lg font-semibold text-forgeGray-900">
          {m.dialog_title}
        </h2>
        <p className="mt-2 text-sm text-forgeGray-600">{m.dialog_description}</p>

        <div className="mt-4 space-y-4">
          <label htmlFor="gen-doc-type" className="block text-sm font-medium text-forgeGray-800">
            {m.field_type}
          </label>
          <select
            id="gen-doc-type"
            value={docType}
            disabled={isPending}
            aria-label={m.field_type}
            className="w-full rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-forgeBrand-500"
            onChange={(e) => setDocType(e.target.value as LegalGeneratedDocumentType)}
          >
            {LEGAL_GENERATED_DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {(typeLabels as Record<string, string>)[t] ?? t}
              </option>
            ))}
          </select>

          <div>
            <label htmlFor="gen-doc-instructions" className="block text-sm font-medium text-forgeGray-800">
              {m.field_instructions}
            </label>
            <p className="mb-1 text-xs text-forgeGray-500">{m.field_instructions_hint}</p>
            <textarea
              id="gen-doc-instructions"
              rows={6}
              value={instructions}
              disabled={isPending}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full resize-y rounded-forge-sm border border-forgeGray-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-forgeBrand-500"
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="gen-doc-json" className="block text-sm font-medium text-forgeGray-800">
              {m.field_parameters_json}
            </label>
            <p className="mb-1 text-xs text-forgeGray-500">{m.field_parameters_json_hint}</p>
            <textarea
              id="gen-doc-json"
              rows={4}
              value={jsonExtra}
              disabled={isPending}
              onChange={(e) => setJsonExtra(e.target.value)}
              aria-label={m.field_parameters_json}
              className="w-full resize-y rounded-forge-sm border border-forgeGray-200 px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-forgeBrand-500"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-forge-sm px-4 py-2 text-sm text-forgeGray-700 ring-1 ring-forgeGray-200 hover:bg-forgeSurface-sunken"
            onClick={onClose}
            disabled={isPending}
          >
            {m.close}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-forge-sm bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-forgeGray-50 hover:bg-forgeBrand-700 disabled:opacity-60"
            onClick={() => void submit()}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? m.generating : m.button_submit}
          </button>
        </div>
      </div>
    </div>
  );
}
