"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import type { ModuloConfig } from "@/lib/modulos/registro";
import { CLASES } from "./clases";

/**
 * Desplegable «Módulos» de la barra: los módulos que este usuario ve. Un solo desplegable abierto a la vez:
 * se cierra con Escape, al navegar y con cualquier clic fuera (que incluye abrir otro desplegable de la barra,
 * como el menú de usuario, que también cierra el suyo con ese mismo clic fuera).
 */
export function SelectorModulos({ modulos, actual }: { modulos: ModuloConfig[]; actual?: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  return (
    <div ref={raiz} className="relative" data-testid="selector-modulos">
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls="selector-modulos-lista"
        aria-haspopup="true"
        onClick={() => setAbierto((a) => !a)}
        className={`${CLASES.boton} ${abierto ? CLASES.botonActivo : ""}`}
      >
        <LayoutGrid aria-hidden className="h-4 w-4" />
        <span className="hidden sm:inline">Módulos</span>
        <ChevronDown aria-hidden className="h-3.5 w-3.5" />
      </button>
      {abierto ? (
        <ul id="selector-modulos-lista" data-testid="selector-modulos-lista" className={CLASES.desplegable}>
          {modulos.map((m) => {
            const Icono = m.icono;
            const es = m.id === actual;
            return (
              <li key={m.id}>
                <Link
                  href={m.raiz}
                  aria-current={es ? "true" : undefined}
                  onClick={() => setAbierto(false)}
                  className={`${CLASES.desplegableItem} ${es ? CLASES.desplegableActivo : ""}`}
                >
                  <Icono aria-hidden className="h-4 w-4 shrink-0" style={{ color: m.acento }} />
                  <span className="truncate">{m.label}</span>
                </Link>
              </li>
            );
          })}
          {modulos.length === 0 ? <li className="px-2 py-1.5 text-xs text-zinc-500">No hay módulos disponibles.</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
