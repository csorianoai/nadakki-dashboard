"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { DCC_CLASSES } from "./clases";

/**
 * Seccion de la referencia v3: tarjeta blanca con cabecera clara, icono de
 * seccion en turquesa, titulo marino y metadato. `clave` = filo superior
 * dorado (Brief, Cola de atencion). Altura automatica; nada se corta.
 */
export function DccSeccion({
  titulo,
  icono: Icono,
  clave = false,
  meta,
  acciones,
  children,
  testId,
}: {
  titulo: string;
  icono: LucideIcon;
  clave?: boolean;
  meta?: string | null;
  acciones?: ReactNode;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId ?? "dcc-seccion"}
      data-clave={clave ? "si" : "no"}
      aria-label={titulo}
      className={`h-auto min-w-0 rounded-[var(--dcc-radius)] border border-[var(--dcc-border)] bg-[var(--dcc-surface)] shadow-[var(--dcc-shadow)] ${clave ? DCC_CLASSES.filoClave : ""}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icono className="h-4 w-4 shrink-0 text-[var(--dcc-teal)]" aria-hidden="true" />
          <h2 className="text-base font-semibold text-[var(--dcc-fg)]">{titulo}</h2>
          {meta ? <span className={`text-xs ${DCC_CLASSES.subtle}`}>{meta}</span> : null}
        </div>
        {acciones}
      </header>
      <div className="px-5 pb-5 pt-3">{children}</div>
    </section>
  );
}
