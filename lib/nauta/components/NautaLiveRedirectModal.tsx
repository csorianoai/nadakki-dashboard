"use client";

import { NautaTaskComposer } from "@/lib/nauta/components/NautaTaskComposer";
import { S } from "@/lib/nauta/strings";

export function NautaLiveRedirectModal({
  open,
  value,
  onChange,
  busy,
  errorMessage,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  value: string;
  onChange: (next: string) => void;
  busy?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  const canSubmit = value.trim().length > 0;

  return (
    <div className="live-modal-overlay" role="presentation" data-testid="nauta-redirect-modal">
      <div
        className="live-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nauta-redirect-dialog-title"
      >
        <h3 id="nauta-redirect-dialog-title" className="live-modal-title">
          {S.midrun.redirectTitle}
        </h3>
        <NautaTaskComposer
          id="nauta-redirect-instruction"
          label={S.midrun.redirectLabel}
          value={value}
          onChange={onChange}
          disabled={busy}
        />
        {errorMessage ? (
          <p className="live-modal-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="live-modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>
            {S.midrun.redirectCancel}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={onSubmit}
            disabled={busy || !canSubmit}
            data-testid="nauta-redirect-submit"
          >
            {busy ? "Enviando…" : S.midrun.redirectSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}
