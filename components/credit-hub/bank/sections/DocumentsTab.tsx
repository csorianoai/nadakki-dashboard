"use client";

import { FileText, Search } from "lucide-react";
import { EscalateOcrButton } from "@/components/credit-hub/bank/EscalateOcrButton";
import { DocumentRequestsPanel } from "@/components/credit-hub/bank/sections/DocumentRequestsPanel";
import type { BankDocumentPayload } from "@/lib/credit-hub/types/bank-views";

const ST_MAP: Record<string, [string, string, string]> = {
  validado: ["var(--ch-success-text)", "var(--ch-success-soft)", "Validado"],
  VALIDADO: ["var(--ch-success-text)", "var(--ch-success-soft)", "Validado"],
  en_revision: ["var(--ch-info-text)", "var(--ch-info-soft)", "En revisión"],
  pendiente: ["var(--ch-warning-text)", "var(--ch-warning-soft)", "Pendiente"],
};

function documentPreviewUrl(doc: BankDocumentPayload): string | null {
  const raw = doc as BankDocumentPayload & {
    preview_url?: string;
    url?: string;
    preview?: { preview_route_template?: string };
  };
  if (typeof raw.preview_url === "string" && raw.preview_url.trim()) return raw.preview_url.trim();
  if (typeof raw.url === "string" && raw.url.trim()) return raw.url.trim();
  const tmpl = raw.preview?.preview_route_template;
  if (typeof tmpl === "string" && tmpl.startsWith("/")) return tmpl;
  return null;
}

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
        const previewUrl = documentPreviewUrl(d);
        const docId = String(d.id ?? "");
        const label = d.name ?? d.label ?? "Documento";
        return (
          <div key={d.id ?? d.name} className="ch-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
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
                disabled={!previewUrl}
                title={previewUrl ? "Abrir vista previa del documento" : "Vista previa no disponible — el backend no publicó URL para este documento"}
                onClick={() => {
                  if (previewUrl && typeof window !== "undefined") window.open(previewUrl, "_blank", "noopener,noreferrer");
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
