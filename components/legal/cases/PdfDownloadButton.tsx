"use client";

import { getPdfExportUrl } from "@/lib/legal/cases/legal-cases-api";

type Props = {
  caseId: string;
  documentId: string;
  tenantId: string;
  label?: string;
};

export function PdfDownloadButton({
  caseId,
  documentId,
  tenantId,
  label = "Descargar PDF",
}: Props) {
  const handleDownload = async () => {
    const url = getPdfExportUrl(caseId, documentId);
    const res = await fetch(url, {
      headers: { "X-Tenant-ID": tenantId.trim() },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `documento_${documentId.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      className="rounded-forge-sm border border-forgeInk-300 bg-forgeSurface-card px-3 py-1.5 text-xs font-medium text-forgeInk-700 hover:bg-forgeInk-100"
      data-testid="pdf-download-button"
    >
      {label}
    </button>
  );
}
