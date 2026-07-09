"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@/components/forge";

export interface EscalateReviewModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (payload: { reason: string; notes: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function EscalateReviewModal({ open, title, onClose, onSubmit, isSubmitting }: EscalateReviewModalProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (reason.trim().length < 3) {
      setError("Indica un motivo de al menos 3 caracteres.");
      return;
    }
    setError(null);
    await onSubmit({ reason: reason.trim(), notes: notes.trim() });
    setReason("");
    setNotes("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="escalate-modal-title"
      data-testid="escalate-review-modal"
    >
      <div className="w-full max-w-md rounded-forge-lg border border-forgeGray-200 bg-white p-5 shadow-forge-lg">
        <h2 id="escalate-modal-title" className="text-forge-lg font-semibold text-forgeGray-900">
          {title}
        </h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">La escalación queda registrada para revisión manual del analista.</p>
        <div className="mt-4 space-y-3">
          <Input label="Motivo *" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Documento ilegible" />
          <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Detalle adicional (opcional)" />
          {error ? <p className="text-forge-sm text-forgeDanger-600">{error}</p> : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Enviando…" : "Escalar a revisión"}
          </Button>
        </div>
      </div>
    </div>
  );
}
