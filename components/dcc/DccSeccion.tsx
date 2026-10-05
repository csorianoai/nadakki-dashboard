"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { DCC_CLASSES } from "./clases";

/** Tono de la banda de cabecera (referencia v3): azul = Datos, dorado = Prioridad. */
export type TonoSeccion = "azul" | "dorado" | "neutro";

const BANDA: Record<TonoSeccion, string> = {
  azul: "bg-[var(--dcc-blue-bg)] border-[var(--dcc-blue-line)]",
  dorado: "bg-[var(--dcc-gold-bg)] border-[var(--dcc-gold-line)]",
  neutro: "bg-[var(--dcc-surface-muted)] border-[var(--dcc-border)]",
};

const ICONO: Record<TonoSeccion, string> = {
  azul: "bg-[var(--dcc-action)] text-[var(--dcc-on-action)]",
  dorado: "bg-[var(--dcc-gold-line)] text-[var(--dcc-gold-ink)]",
  neutro: "bg-[var(--dcc-surface)] text-[var(--dcc-fg-muted)] border border-[var(--dcc-border-strong)]",
};

/**
 * Seccion de la referencia v3: tarjeta blanca con banda de cabecera clara
 * tintada, icono, titulo y metadato. Altura automatica; nada se corta.
 */
export function DccSeccion({
  titulo,
  icono: Icono,
  tono = "neutro",
  meta,
  acciones,
  children,
  testId,
}: {
  titulo: string;
  icono: LucideIcon;
  tono?: TonoSeccion;
  meta?: string | null;
  acciones?: ReactNode;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId ?? "dcc-seccion"}
      data-tono={tono}
      aria-label={titulo}
      className="h-auto min-w-0 overflow-visible rounded-[var(--dcc-radius)] border border-[var(--dcc-border)] bg-[var(--dcc-surface)] shadow-[var(--dcc-shadow)]"
    >
      <header className={`flex flex-wrap items-center justify-between gap-2 rounded-t-[var(--dcc-radius)] border-b px-5 py-3 ${BANDA[tono]}`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${ICONO[tono]}`}>
            <Icono className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-[var(--dcc-fg)]">{titulo}</h2>
          {meta ? <span className={`text-xs ${DCC_CLASSES.subtle}`}>{meta}</span> : null}
        </div>
        {acciones}
      </header>
      <div className="p-[var(--dcc-pad)]">{children}</div>
    </section>
  );
}
