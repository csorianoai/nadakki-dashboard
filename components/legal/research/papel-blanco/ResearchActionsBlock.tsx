"use client";

import { Copy, FileText, Printer, Share2, FileDown, Paperclip } from "lucide-react";
import type { AgentRunResponse } from "@/types/legal";
import { buildCopyPayload } from "@/lib/legal/research/citation-utils";
import { toast } from "@/components/forge/ui/Toast";

type Props = {
  content: string;
  run: AgentRunResponse;
};

function roadmapToast(feature: string) {
  toast.info("En desarrollo — requiere el motor de exportación con citas adjuntas.");
}

export function ResearchActionsBlock({ content, run }: Props) {
  const copyText = async (text: string, label: string) => {
    if (!text.trim()) {
      toast.error("Nada que copiar");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  const roadmap = [
    { label: "PDF", icon: FileDown },
    { label: "Word", icon: FileText },
    { label: "Adjuntar citas", icon: Paperclip },
    { label: "Compartir", icon: Share2 },
  ] as const;

  return (
    <section className="lr-actions-bar" aria-label="Acciones" data-noprint>
      <div className="lr-block-label lr-block-label--ink" style={{ marginBottom: 12 }}>
        Acciones
      </div>
      <div className="lr-actions-groups">
        <button
          type="button"
          className="lr-btn-primary"
          onClick={() => void copyText(content, "Respuesta copiada")}
        >
          <Copy size={14} style={{ marginRight: 6, verticalAlign: -2 }} aria-hidden />
          Copiar
        </button>
        <button
          type="button"
          className="lr-btn-secondary"
          onClick={() => void copyText(buildCopyPayload(content, run), "Respuesta + citas copiadas")}
        >
          Copiar + citas
        </button>
        <button type="button" className="lr-btn-secondary" onClick={() => window.print()}>
          <Printer size={14} style={{ marginRight: 6, verticalAlign: -2 }} aria-hidden />
          Imprimir
        </button>

        <div className="lr-actions-divider" aria-hidden />

        {roadmap.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="lr-btn-roadmap"
            onClick={() => roadmapToast(label)}
          >
            <Icon size={14} style={{ marginRight: 6, verticalAlign: -2 }} aria-hidden />
            {label}
            <span className="lr-tag-pronto">pronto</span>
          </button>
        ))}
      </div>
    </section>
  );
}
