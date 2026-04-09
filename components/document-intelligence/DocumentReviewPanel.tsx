"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { CreditApiError } from "@/lib/credit-api";
import {
  reviewDocument,
  type ReviewDecision,
} from "@/lib/api/document-intelligence";

export interface DocumentReviewPanelProps {
  tenantId: string;
  applicationId: string;
  documentId: string;
  onSaved?: () => void;
}

const DECISIONS: { id: ReviewDecision; label: string; Icon: typeof CheckCircle2 }[] = [
  { id: "approve", label: "Aprobar", Icon: CheckCircle2 },
  { id: "needs_review", label: "Requiere revisión", Icon: HelpCircle },
  { id: "reject", label: "Rechazar", Icon: XCircle },
];

export default function DocumentReviewPanel({
  tenantId,
  applicationId,
  documentId,
  onSaved,
}: DocumentReviewPanelProps) {
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit() {
    if (!decision || !tenantId.trim()) return;
    if (decision === "reject" && !notes.trim()) {
      setError("Las notas son obligatorias si rechazas el documento.");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await reviewDocument(applicationId, documentId, { decision, notes: notes.trim() || undefined }, tenantId);
      setOk("Revisión guardada.");
      onSaved?.();
    } catch (e) {
      setError(
        e instanceof CreditApiError ? e.message : "No se pudo guardar la revisión."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-4">
      <h3 className="text-sm font-medium text-emerald-100 m-0">
        Revisión documento (banco)
      </h3>
      <p className="text-[11px] font-mono text-slate-500 m-0">{documentId}</p>

      <div className="flex flex-wrap gap-2">
        {DECISIONS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setDecision(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              decision === id
                ? "bg-emerald-500/25 border-emerald-400/50 text-emerald-100"
                : "border-white/10 text-slate-400 hover:bg-white/5"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div>
        <label className="text-[10px] uppercase text-slate-500 block mb-1">
          Notas {decision === "reject" ? "(obligatorias)" : "(opcional)"}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
          placeholder={
            decision === "reject"
              ? "Describe el motivo del rechazo…"
              : "Comentarios para auditoría…"
          }
        />
      </div>

      {error ? (
        <p className="text-xs text-red-300 m-0">{error}</p>
      ) : null}
      {ok ? (
        <p className="text-xs text-emerald-200 m-0">{ok}</p>
      ) : null}

      <button
        type="button"
        disabled={!decision || busy || !tenantId.trim()}
        onClick={() => void submit()}
        className="w-full py-2 rounded-lg text-sm font-medium bg-emerald-600/80 hover:bg-emerald-600 text-white disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Guardar revisión
      </button>
    </div>
  );
}
