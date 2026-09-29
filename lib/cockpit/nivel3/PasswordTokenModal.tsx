"use client";

import { useState } from "react";

export function PasswordTokenModal({ token, onClose }: { token: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!token) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
  };

  const close = () => {
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="ch-card max-w-md w-full p-4">
        <h4 className="font-semibold mb-2">Contraseña temporal</h4>
        <p className="text-sm text-[var(--ch-warning-text)] mb-2">
          Es la contraseña con la que el usuario entra, no un enlace de
          restablecimiento. No se mostrará de nuevo: copiala y entregala ahora.
        </p>
        <code className="block break-all rounded bg-[var(--ch-surface-3)] p-2 text-xs">{token}</code>
        <div className="mt-3 flex gap-2">
          <button type="button" className="ch-btn ch-btn-persona ch-btn-sm" onClick={() => void copy()}>{copied ? "Copiado" : "Copiar"}</button>
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={close}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
