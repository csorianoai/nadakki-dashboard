"use client";

import { FileText, Search } from "lucide-react";
import type { BankDocumentPayload } from "@/lib/credit-hub/types/bank-views";

const ST_MAP: Record<string, [string, string, string]> = {
  validado: ["var(--ch-success-text)", "var(--ch-success-soft)", "Validado"],
  VALIDADO: ["var(--ch-success-text)", "var(--ch-success-soft)", "Validado"],
  en_revision: ["var(--ch-info-text)", "var(--ch-info-soft)", "En revisión"],
  pendiente: ["var(--ch-warning-text)", "var(--ch-warning-soft)", "Pendiente"],
};

export function DocumentsTab({ docs }: { docs: BankDocumentPayload[] }) {
  if (!docs.length) {
    return <div className="ch-card" style={{ padding: 24, color: "var(--ch-text-3)" }}>Sin documentos cargados.</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
      {docs.map((d) => {
        const status = d.status ?? "pendiente";
        const [c, bg, l] = ST_MAP[status] ?? ST_MAP.pendiente!;
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
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{d.name ?? d.label ?? "Documento"}</div>
            <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" style={{ marginTop: "auto" }}>
              <Search className="h-3.5 w-3.5" aria-hidden />
              Ver documento
            </button>
          </div>
        );
      })}
    </div>
  );
}
