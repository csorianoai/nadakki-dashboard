"use client";

import type { ReactNode } from "react";
import { ALTO_BARRA_SUITE, BarraSuite } from "./BarraSuite";

/**
 * La barra de la Suite arriba y debajo la carcasa del core, que se desplaza en su propio contenedor.
 * `--alto-marco` es el alto que queda bajo la barra: lo usan las carcasas que se medían con 100vh
 * (globals.css adapta h-screen y min-h-screen dentro del marco), para que ningún menú lateral quede
 * cortado por abajo ni tapado por la barra. `barra` sustituye a la barra básica (ModuleShell pone la suya, con
 * selector de módulos, buscador, notificaciones y usuario, sobre la misma base).
 */
export function MarcoSuite({ children, barra }: { children: ReactNode; barra?: ReactNode }) {
  return (
    <div
      data-marco-suite=""
      className="flex h-[100dvh] flex-col overflow-hidden"
      style={{ ["--alto-marco" as string]: `calc(100dvh - ${ALTO_BARRA_SUITE}px)` }}
    >
      {barra ?? <BarraSuite />}
      <div data-marco-suite-contenido="" className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
