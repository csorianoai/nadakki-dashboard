"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { effectiveWizardDocuments, tenantDocumentKey } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import {
  extractDocumentosFromApplicationRaw,
  resolveApplicationDocumentStatus,
} from "@/lib/credit-hub/dealer/wizard-gates";
import type { TenantBankingConfig } from "@/lib/credit-hub/types/tenantConfig";

export interface DealerApplicationDocumentsSectionProps {
  tenantConfig: TenantBankingConfig;
  applicationRaw: unknown;
}

export function DealerApplicationDocumentsSection({
  tenantConfig,
  applicationRaw,
}: DealerApplicationDocumentsSectionProps) {
  const docList = useMemo(() => effectiveWizardDocuments(tenantConfig), [tenantConfig]);
  const documentos = useMemo(() => extractDocumentosFromApplicationRaw(applicationRaw), [applicationRaw]);
  const rows = useMemo(
    () => resolveApplicationDocumentStatus(docList, tenantDocumentKey, documentos),
    [docList, documentos],
  );

  if (rows.length === 0) return null;

  const attachedCount = rows.filter((row) => row.uploaded).length;

  return (
    <div className="ch-card mt-4 p-4" data-testid="dealer-application-documents">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <FileText className="h-4 w-4" aria-hidden />
        Documentos
        <span className="text-xs font-normal" style={{ color: "var(--ch-text-3)" }}>
          {attachedCount} de {rows.length} adjuntos
        </span>
      </h3>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--ch-border)", background: "var(--ch-surface)" }}
            data-testid={`dealer-doc-row-${row.key}`}
          >
            <span style={{ fontSize: 13 }}>{row.label}</span>
            {row.uploaded ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                style={{ color: "var(--ch-success-text)", background: "var(--ch-success-soft)" }}
              >
                <CheckCircle className="h-3.5 w-3.5" aria-hidden />
                ADJUNTO
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                style={{ color: "var(--ch-danger-text)", background: "var(--ch-danger-soft)" }}
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                PENDIENTE
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
