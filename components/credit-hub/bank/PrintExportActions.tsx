"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError, resolveCreditHubFetchUrl } from "@/lib/credit-hub/api/client";
import { applicationSummaryPdfPath } from "@/lib/credit-hub/api/bankExperienceClient";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { tokenStorage } from "@/lib/auth/token-storage";

const LEGACY_TOKEN_KEY = "nadakki_sic_token";

function bearerToken(): string | null {
  return tokenStorage.getAccessToken() ?? (typeof window !== "undefined" ? window.localStorage.getItem(LEGACY_TOKEN_KEY) : null);
}

export function PrintExportActions({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();
  const [exporting, setExporting] = useState(false);

  const print = () => {
    if (typeof window !== "undefined") window.print();
  };

  const exportPdf = async () => {
    if (!apiTenantId || exporting) return;
    setExporting(true);
    try {
      const url = resolveCreditHubFetchUrl(applicationSummaryPdfPath(applicationId));
      const token = bearerToken();
      const res = await fetch(url, {
        headers: {
          "X-Tenant-ID": apiTenantId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        if (res.status === 404 || res.status === 501) {
          forgeToast.error("Exportación PDF no disponible aún");
          return;
        }
        throw new CHApiError(`Error ${res.status}`, res.status);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `expediente-${applicationId}.pdf`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      forgeToast.success("PDF descargado");
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo exportar el PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2 flex-shrink-0 no-print" data-testid="print-export-actions">
      <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={print} data-testid="print-btn">
        <FileText className="h-3.5 w-3.5" aria-hidden />
        Imprimir
      </button>
      <button
        type="button"
        className="ch-btn ch-btn-secondary ch-btn-sm"
        onClick={() => void exportPdf()}
        disabled={exporting}
        data-testid="export-pdf-btn"
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        {exporting ? "Exportando…" : "Exportar PDF"}
      </button>
    </div>
  );
}
