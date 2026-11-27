"use client";

import { useState } from "react";
import type { LegalGeneratedDocumentType } from "@/lib/legal/cases/case-types";
import { LEGAL_GENERATED_DOCUMENT_TYPES } from "@/lib/legal/cases/case-types";
import { useGenerateDocument } from "@/hooks/legal/useDocumentGeneration";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { toast } from "@/components/forge/ui/Toast";

/** Mensaje para el abogado (QA 23-nov: se mostraba «capability_denied:…:TARGET_CORE_NOT_READY»). */
export function mensajeGeneracion(e: unknown, porDefecto: string): string {
  const txt = e instanceof Error ? e.message : "";
  if (/TARGET_CORE_NOT_READY/.test(txt)) {
    return "La generación de documentos con IA aún no está habilitada en este despacho. No se generó nada.";
  }
  if (/capability_denied|\(403\)/.test(txt)) {
    return "Tu plan o tu rol no permite generar documentos con IA. No se generó nada.";
  }
  if (/\(5\d\d\)/.test(txt)) return "El servicio de generación no respondió. No se generó nada; intenta más tarde.";
  return txt || porDefecto;
}

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
  // El error queda en el diálogo: el aviso flotante desaparece en segundos.
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      await mutateAsync({ document_type: docType, parameters });
      toast.success(m.success);
      setInstructions("");
      setJsonExtra("");
      onClose();
    } catch (e: unknown) {
      const msg = mensajeGeneracion(e, m.error_generate);
      setError(msg);
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
        {error ? (
          <p role="alert" className="mt-2 rounded-forge-sm bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

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

          {/* Validación 27-nov-2026: el abogado veía «Parámetros adicionales (JSON)». Queda plegado, para soporte. */}
          <details className="text-sm">
            <summary className="cursor-pointer text-xs text-forgeGray-500">Opciones avanzadas</summary>
            <div className="mt-2">
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
          </details>
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
