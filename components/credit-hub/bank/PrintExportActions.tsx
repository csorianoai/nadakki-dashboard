"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError, resolveCreditHubFetchUrl } from "@/lib/credit-hub/api/client";
import {
  auditTrailPdfPath,
  decisionLetterPdfPath,
  expedientePdfPath,
} from "@/lib/credit-hub/api/bankExperienceClient";
import { usePrimaryOfferId } from "@/lib/credit-hub/hooks/usePrimaryOfferId";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { tokenStorage } from "@/lib/auth/token-storage";

const LEGACY_TOKEN_KEY = "nadakki_sic_token";

type ExportKind = "expediente" | "decision-letter" | "audit-trail";

function bearerToken(): string | null {
  return tokenStorage.getAccessToken() ?? (typeof window !== "undefined" ? window.localStorage.getItem(LEGACY_TOKEN_KEY) : null);
}

export function PrintExportActions({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();
  const { offerId } = usePrimaryOfferId(applicationId);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const print = () => {
    if (typeof window !== "undefined") window.print();
  };

  const downloadPdf = async (kind: ExportKind) => {
    if (!apiTenantId || exporting) return;
    if (kind === "decision-letter" && !offerId) {
      forgeToast.error("Selecciona una oferta para exportar la carta de decisión");
      return;
    }
    setExporting(kind);
    setMenuOpen(false);
    try {
      const path =
        kind === "expediente"
          ? expedientePdfPath(applicationId)
          : kind === "decision-letter"
            ? decisionLetterPdfPath(applicationId, offerId!)
            : auditTrailPdfPath(applicationId);
      const url = resolveCreditHubFetchUrl(path);
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
      a.download =
        kind === "expediente"
          ? `expediente-${applicationId}.pdf`
          : kind === "decision-letter"
            ? `carta-decision-${applicationId}.pdf`
            : `audit-trail-${applicationId}.pdf`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      forgeToast.success("PDF descargado");
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo exportar el PDF");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative flex gap-2 flex-shrink-0 no-print" data-testid="print-export-actions">
      <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={print} data-testid="print-btn">
        <FileText className="h-3.5 w-3.5" aria-hidden />
        Imprimir
      </button>
      <button
        type="button"
        className="ch-btn ch-btn-secondary ch-btn-sm"
        onClick={() => setMenuOpen((v) => !v)}
        disabled={!!exporting}
        data-testid="export-pdf-btn"
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        {exporting ? "Exportando…" : "Exportar"}
      </button>
      {menuOpen ? (
        <div
          className="absolute right-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border bg-white py-1 shadow-lg"
          style={{ borderColor: "var(--ch-border)" }}
          data-testid="export-menu"
        >
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-forgeGray-50"
            onClick={() => void downloadPdf("expediente")}
          >
            Expediente PDF
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-forgeGray-50 disabled:opacity-50"
            disabled={!offerId}
            onClick={() => void downloadPdf("decision-letter")}
          >
            Carta de decisión
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-forgeGray-50"
            onClick={() => void downloadPdf("audit-trail")}
          >
            Audit trail PDF
          </button>
        </div>
      ) : null}
    </div>
  );
}
