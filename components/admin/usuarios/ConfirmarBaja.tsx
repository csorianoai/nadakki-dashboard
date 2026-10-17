"use client";

import type { Usuario } from "./api";

export function ConfirmarBaja({ usuario, onSi, onNo }: { usuario: Usuario; onSi: () => void; onNo: () => void }) {
  return (
    <div data-testid="confirmar-baja" role="alertdialog" aria-modal="true" className="rounded border border-white/20 bg-black/60 p-4">
      <p className="text-sm">¿Dar de baja a {usuario.email}? Dejará de poder entrar; se puede reactivar desde el backend.</p>
      <div className="mt-3 flex gap-2">
        <button data-testid="confirmar-baja-si" className="rounded bg-red-600 px-3 py-1 text-sm" onClick={onSi}>Dar de baja</button>
        <button data-testid="confirmar-baja-no" className="rounded bg-white/10 px-3 py-1 text-sm" onClick={onNo}>Cancelar</button>
      </div>
    </div>
  );
}
