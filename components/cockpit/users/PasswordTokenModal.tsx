"use client";

import { useState } from "react";

export function PasswordTokenModal({ token, onClose }: { token: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!token) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-md w-full rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
        <h4 className="font-semibold">Token de contraseña</h4>
        <p className="mt-2 text-sm text-cockpit-warn">No se mostrará de nuevo. Compártelo por canal seguro.</p>
        <code className="mt-3 block break-all rounded bg-cockpit-bg p-2 text-xs">{token}</code>
        <div className="mt-3 flex gap-2">
          <button type="button" className="rounded bg-cockpit-accent px-3 py-1 text-sm" onClick={() => void navigator.clipboard.writeText(token).then(() => setCopied(true))}>
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button type="button" className="rounded border border-cockpit-border px-3 py-1 text-sm" onClick={() => { setCopied(false); onClose(); }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
