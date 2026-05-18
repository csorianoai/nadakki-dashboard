"use client";

import { useEffect, useState } from "react";

export interface StipulationRejectModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function StipulationRejectModal({ open, title, onClose, onConfirm }: StipulationRejectModalProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  const valid = reason.trim().length >= 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-stip-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="reject-stip-title" className="m-0 text-lg font-semibold text-forgeGray-900">
          Rechazar estipulación
        </h2>
        <p className="mt-2 text-forge-sm text-forgeGray-600">{title}</p>
        <label className="mt-4 block text-forge-sm font-medium text-forgeGray-800" htmlFor="reject-reason">
          Motivo <span className="text-rose-600">*</span>
        </label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          required
          className="mt-1 w-full rounded-lg border border-forgeGray-200 px-3 py-2 text-forge-sm"
        />
        {!valid ? <p className="mt-1 text-forge-xs text-forgeGray-500">Mínimo 3 caracteres.</p> : null}
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
            className="rounded-lg bg-rose-600 px-4 py-2 text-forge-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            disabled={busy || !valid}
            data-nadakki-track="bank.stipulation.reject.confirm"
            onClick={() => {
              if (!valid) return;
              setBusy(true);
              void (async () => {
                try {
                  await onConfirm(reason.trim());
                  onClose();
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}
