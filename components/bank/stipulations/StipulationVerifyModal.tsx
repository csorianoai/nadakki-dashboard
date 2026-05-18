"use client";

import { useEffect, useState } from "react";

export interface StipulationVerifyModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (notes: string | undefined) => Promise<void>;
}

export function StipulationVerifyModal({ open, title, onClose, onConfirm }: StipulationVerifyModalProps) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setNotes("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-stip-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="verify-stip-title" className="m-0 text-lg font-semibold text-forgeGray-900">
          Verificar estipulación
        </h2>
        <p className="mt-2 text-forge-sm text-forgeGray-600">{title}</p>
        <label className="mt-4 block text-forge-sm font-medium text-forgeGray-800" htmlFor="verify-notes">
          Notas (opcional)
        </label>
        <textarea
          id="verify-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-forgeGray-200 px-3 py-2 text-forge-sm"
        />
        <div className="mt-6 flex justify-end gap-2 no-print">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-forge-sm font-medium text-forgeGray-700 hover:bg-forgeGray-50"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-forge-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            disabled={busy}
            data-nadakki-track="bank.stipulation.verify.confirm"
            onClick={() => {
              setBusy(true);
              void (async () => {
                try {
                  await onConfirm(notes.trim() || undefined);
                  onClose();
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            Confirmar verificación
          </button>
        </div>
      </div>
    </div>
  );
}
