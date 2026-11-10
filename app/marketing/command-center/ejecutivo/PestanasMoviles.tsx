"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PestanaMovil {
  id: string;
  titulo: string;
  contenido: ReactNode;
}

/**
 * Pestañas compactas de la pantalla patron en movil (< 640 px). Patron WAI-ARIA de pestañas con activacion automatica:
 * flechas izquierda/derecha, Inicio y Fin; roving tabindex; el panel se anuncia con aria-labelledby.
 *
 * Por que no se usa SeccionesAnaliticas del kit aqui: sus pestañas son el Tabs de Forge, que (a) se parte en dos filas a 320 px
 * y (b) enmarca el panel con borde y 16 px de relleno (el contenido pierde 34 px de ancho y ~150 px de alto). Con eso Inversion,
 * CPA y Leads no caben juntos en el primer viewport de 320x568 (decision de Cesar, 10-nov). Aqui: una sola fila de tres pestañas de
 * 44 px y un panel sin marco. Los colores salen de los tokens del kit. Recomendacion: una variante «compacta» del kit en otro PR.
 */
export function PestanasMoviles({ pestanas, className }: { pestanas: PestanaMovil[]; className?: string }) {
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activa, setActiva] = useState<string>(pestanas[0]?.id ?? "");
  if (pestanas.length === 0) return null;
  const actual = pestanas.find((p) => p.id === activa) ?? pestanas[0];

  function alTeclear(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = pestanas.length;
    let destino = -1;
    if (e.key === "ArrowRight") destino = (i + 1) % n;
    else if (e.key === "ArrowLeft") destino = (i - 1 + n) % n;
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = n - 1;
    if (destino < 0) return;
    e.preventDefault();
    setActiva(pestanas[destino].id);
    refs.current[destino]?.focus();
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div role="tablist" aria-orientation="horizontal" className="kit-bg-hundida grid grid-cols-3 gap-1 rounded-[12px] border kit-bd-suave p-1">
        {pestanas.map((p, i) => {
          const seleccionada = p.id === actual.id;
          return (
            <button
              key={p.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${p.id}`}
              aria-selected={seleccionada}
              aria-controls={`${base}-panel-${p.id}`}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => setActiva(p.id)}
              onKeyDown={(e) => alTeclear(e, i)}
              className={cn(
                "kit-foco inline-flex min-h-[44px] min-w-0 items-center justify-center rounded-[9px] border px-1 text-[13px]",
                seleccionada ? "kit-ctl-activo font-semibold" : "border-transparent font-medium kit-txt-2"
              )}
            >
              {p.titulo}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${base}-panel-${actual.id}`} aria-labelledby={`${base}-tab-${actual.id}`} tabIndex={0} className="kit-foco min-w-0">
        {actual.contenido}
      </div>
    </div>
  );
}
