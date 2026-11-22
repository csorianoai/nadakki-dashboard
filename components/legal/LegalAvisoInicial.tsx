"use client";

import { useEffect, useRef, useState } from "react";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";

/**
 * Aviso legal (GR-14 / Ley 91, Art. 6) al ENTRAR al Core Legal: una vez por sesión del navegador, como ventana que
 * se cierra con «Entendido» y que ya no vuelve a tapar el contenido (César, 2026-11-22). Reemplaza el pie y la
 * franja fijos. El aviso breve junto a cada respuesta de IA (LegalDisclaimer compact) se mantiene.
 */
export const CLAVE_AVISO_LEGAL = "nadakki:legal:aviso-ley91-visto";

function yaVisto(): boolean {
  try {
    return window.sessionStorage.getItem(CLAVE_AVISO_LEGAL) === "1";
  } catch {
    return false;
  }
}

export function LegalAvisoInicial() {
  const m = useLegalHomeMessages();
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!yaVisto()) setAbierto(true);
  }, []);
  useEffect(() => {
    if (abierto) boton.current?.focus();
  }, [abierto]);

  const cerrar = () => {
    try {
      window.sessionStorage.setItem(CLAVE_AVISO_LEGAL, "1");
    } catch {
      /* sin almacenamiento: se vuelve a mostrar en la próxima carga, nunca bloquea */
    }
    setAbierto(false);
  };

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="aviso-legal-titulo"
        aria-describedby="aviso-legal-texto"
        data-testid="aviso-legal-inicial"
        onKeyDown={(e) => {
          if (e.key === "Escape") cerrar();
        }}
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
      >
        <h2 id="aviso-legal-titulo" className="text-lg font-semibold text-slate-900">
          {m.disclaimer_title}
        </h2>
        <p id="aviso-legal-texto" className="mt-3 text-[15px] leading-relaxed text-slate-700">
          {m.disclaimer_ley_91}
        </p>
        <div className="mt-5 flex justify-end">
          <button
            ref={boton}
            type="button"
            onClick={cerrar}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
