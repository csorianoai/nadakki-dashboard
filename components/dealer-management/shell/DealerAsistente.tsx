"use client";

/** Asistente contable en el chrome del dealer (F4E-4): solo bajo /autos/dealer; el panel se oculta, no se desmonta. */

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AsistenteContable } from "@/components/ai/AsistenteContable";
import { BienvenidaPrimerosPasos } from "@/components/ai/BienvenidaPrimerosPasos";

export function DealerAsistente() {
  const pathname = usePathname() ?? "";
  const [abierto, setAbierto] = useState(false);
  if (pathname !== "/autos/dealer" && !pathname.startsWith("/autos/dealer/")) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2" data-testid="dealer-asistente">
      {/* Bienvenida de primeros pasos: encima del botón, oculta mientras el panel está abierto. */}
      {abierto ? null : <BienvenidaPrimerosPasos />}
      {/* Oculto con `hidden` y no desmontado: la conversación vive en el estado del panel y dura la sesión. */}
      <div hidden={!abierto} className="w-[min(24rem,calc(100vw-2rem))] shadow-lg">
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="mb-1 ml-auto block min-h-11 rounded border border-[var(--dcc-border-strong)] bg-[var(--bg)] px-3 text-sm text-[var(--fg)]"
        >
          Cerrar asistente
        </button>
        <AsistenteContable />
      </div>
      {abierto ? null : (
        <button
          type="button"
          aria-expanded={false}
          onClick={() => setAbierto(true)}
          className="min-h-11 rounded-full bg-[var(--dcc-navy)] px-4 text-sm font-semibold text-[var(--dcc-on-navy)] shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--dcc-teal)]"
        >
          Asistente contable
        </button>
      )}
    </div>
  );
}
