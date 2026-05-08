"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Scale, ShieldAlert, BookMarked, Users } from "lucide-react";
import type { ExtractedDocumentData } from "@/lib/shared/document-upload-types";
import { cn } from "@/lib/utils";

type Props = {
  data: ExtractedDocumentData | undefined;
  onChange?: (next: ExtractedDocumentData) => void;
  editable?: boolean;
  className?: string;
};

export function ExtractedDataPanel({ data, onChange, editable = true, className }: Props) {
  const [open, setOpen] = useState(true);
  const [local, setLocal] = useState<ExtractedDocumentData>({});

  useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  const merged: ExtractedDocumentData = { ...local, ...data };
  const summary = merged.plain_text_summary ?? "";

  const patch = (partial: Partial<ExtractedDocumentData>) => {
    const next = { ...merged, ...partial };
    setLocal(next);
    onChange?.(next);
  };

  if (!data && !merged.plain_text_summary) {
    return null;
  }

  return (
    <div className={cn("rounded-xl border border-zinc-800/50 bg-zinc-900/40", className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-zinc-200"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-violet-400" aria-hidden />
          Datos extraídos (IA)
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open ? (
        <div className="space-y-3 border-t border-zinc-800/50 px-4 py-3">
          {merged.document_type ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Tipo detectado</p>
              <p className="text-sm text-zinc-200">{merged.document_type}</p>
            </div>
          ) : null}
          {(merged.parties?.length ?? 0) > 0 ? (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <Users className="h-3 w-3" aria-hidden />
                Partes
              </p>
              <ul className="list-inside list-disc text-sm text-zinc-300">
                {merged.parties!.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {(merged.risk_alerts?.length ?? 0) > 0 ? (
            <div className="rounded-lg border border-amber-500/25 bg-amber-950/20 p-2">
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-amber-400">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                Alertas
              </p>
              <ul className="space-y-1 text-xs text-amber-200/90">
                {merged.risk_alerts!.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {(merged.key_clauses?.length ?? 0) > 0 ? (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <BookMarked className="h-3 w-3" aria-hidden />
                Cláusulas clave
              </p>
              <ul className="space-y-1 text-sm text-zinc-300">
                {merged.key_clauses!.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <label htmlFor="extracted-summary" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Resumen para el expediente (editable)
            </label>
            <textarea
              id="extracted-summary"
              rows={8}
              disabled={!editable}
              value={summary}
              onChange={(e) => patch({ plain_text_summary: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-800/50 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
            <p className="mt-1 text-[11px] text-zinc-600">Confianza global simulada: revisar antes de enviar al Legal Core.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
