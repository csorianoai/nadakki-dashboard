"use client";

import { S } from "@/lib/nauta/strings";

export function NautaLiveStopDialog({
  open,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="live-modal-overlay" role="presentation" data-testid="nauta-stop-dialog">
      <div
        className="live-modal live-modal--confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nauta-stop-dialog-title"
      >
        <h3 id="nauta-stop-dialog-title" className="live-modal-title">
          {S.midrun.stopConfirmTitle}
        </h3>
        <p className="live-modal-body">{S.midrun.stopConfirmBody}</p>
        <div className="live-modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>
            {S.midrun.stopConfirmCancel}
          </button>
          <button
            type="button"
            className="btn danger-outline"
            onClick={onConfirm}
            disabled={busy}
            data-testid="nauta-stop-confirm"
          >
            {busy ? "Deteniendo…" : S.midrun.stopConfirmAction}
          </button>
        </div>
      </div>
    </div>
  );
}
