"use client";

import { FileText, Search } from "lucide-react";
import { EscalateOcrButton } from "@/components/credit-hub/bank/EscalateOcrButton";
import { DocumentRequestsPanel } from "@/components/credit-hub/bank/sections/DocumentRequestsPanel";
import { readBankApplicationAuthToken, buildBankApplicationDetailHeadersWithRole } from "@/lib/bank-application-detail/fetch-detail";
import { tokenStorage } from "@/lib/auth/token-storage";
import { bankDocumentDownloadUrl } from "@/lib/bank/document-preview-api";
import type { BankDocumentPayload } from "@/lib/credit-hub/types/bank-views";

const ST_MAP: Record<string, [string, string, string]> = {
  validado: ["var(--ch-success-text)", "var(--ch-success-soft)", "Validado"],
  VALIDADO: ["var(--ch-success-text)", "var(--ch-success-soft)", "Validado"],
  completed: ["var(--ch-success-text)", "var(--ch-success-soft)", "Validado"],
  COMPLETED: ["var(--ch-success-text)", "var(--ch-success-soft)", "Validado"],
  en_revision: ["var(--ch-info-text)", "var(--ch-info-soft)", "En revisión"],
  processing: ["var(--ch-info-text)", "var(--ch-info-soft)", "En revisión"],
  PROCESSING: ["var(--ch-info-text)", "var(--ch-info-soft)", "En revisión"],
  pendiente: ["var(--ch-warning-text)", "var(--ch-warning-soft)", "Pendiente"],
  pending: ["var(--ch-warning-text)", "var(--ch-warning-soft)", "Pendiente"],
  PENDING: ["var(--ch-warning-text)", "var(--ch-warning-soft)", "Pendiente"],
  failed: ["var(--ch-danger-text)", "var(--ch-danger-soft)", "Falló"],
  FAILED: ["var(--ch-danger-text)", "var(--ch-danger-soft)", "Falló"],
};

export function DocumentsTab({ docs, applicationId }: { docs: BankDocumentPayload[]; applicationId: string }) {
  if (!docs.length) {
    return <div className="ch-card" style={{ padding: 24, color: "var(--ch-text-3)" }}>Sin documentos cargados.</div>;
  }

  return (
    <div>
      <DocumentRequestsPanel applicationId={applicationId} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginTop: 12 }}>
      {docs.map((d) => {
        const status = d.status ?? "pendiente";
        const [c, bg, l] = ST_MAP[status] ?? ST_MAP.pendiente!;
        const docId = String(d.id ?? "");
        const authToken = tokenStorage.getAccessToken() || readBankApplicationAuthToken();
        const label = d.name ?? d.label ?? "Documento";
        return (
          <div key={d.id ?? d.doc_id ?? d.name ?? d.filename ?? `document-${i}`} className="ch-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ width: 34, height: 34, borderRadius: 7, background: "var(--ch-surface-2)", color: "var(--ch-text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText className="h-4 w-4" aria-hidden />
              </div>
              <span className="ch-pill" style={{ color: c, background: bg, height: 21, fontSize: 10.5 }}>
                {l}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto" }}>
              <button
                type="button"
                className="ch-btn ch-btn-secondary ch-btn-sm"
                disabled={!docId || !authToken}
                title={!authToken ? "Inicia sesión para abrir el documento" : "Abrir documento"}
                onClick={() => {
                  if (!docId || !authToken || typeof window === "undefined") return;
                  const popup = window.open("", "_blank", "noopener,noreferrer");
                  if (!popup) return;
                  void (async () => {
                    const url = bankDocumentDownloadUrl(applicationId, docId);
                    try {
                      const res = await fetch(url, {
                        method: "GET",
                        headers: {
                          Accept: "application/pdf,image/*,*/*",
                          ...buildBankApplicationDetailHeadersWithRole(authToken, "BANK_ANALYST"),
                        },
                        credentials: "omit",
                        cache: "no-store",
                      });
                      if (!res.ok) throw new Error(`Documento ${res.status}`);
                      const blob = await res.blob();
                      const objectUrl = URL.createObjectURL(blob);
                      popup.location.href = objectUrl;
                      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
                    } catch {
                      popup.close();
                    }
                  })();
                }}
              >
                <Search className="h-3.5 w-3.5" aria-hidden />
                Ver documento
              </button>
              {docId ? <EscalateOcrButton applicationId={applicationId} docId={docId} docLabel={label} /> : null}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
