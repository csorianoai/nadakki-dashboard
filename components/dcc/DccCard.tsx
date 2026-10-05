"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Calidad } from "@/lib/dcc/calidad";
import { DCC_CLASSES } from "./clases";
import { DccTooltip } from "./DccTooltip";
import { SelloCalidad } from "./SelloCalidad";

export type DccCardProps = {
  titulo: string;
  /** Rotulos tecnicos (metric_key, policy, endpoint): solo en tooltip. */
  tecnico?: string | null;
  calidad?: Calidad | null;
  acciones?: ReactNode;
  /** Evidencia plegada bajo "Ver evidencia". */
  evidencia?: ReactNode;
  children?: ReactNode;
  testId?: string;
};

/**
 * Tarjeta del DCC. Altura automatica: el contenido nunca se corta (sin
 * alturas fijas ni overflow oculto). Cabecera clara, sin bloques oscuros.
 */
export function DccCard({ titulo, tecnico, calidad, acciones, evidencia, children, testId }: DccCardProps) {
  return (
    <section data-testid={testId ?? "dcc-card"} className={DCC_CLASSES.card} aria-label={titulo}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <DccTooltip contenido={tecnico}>
          <h2 className="text-sm font-semibold text-[var(--dcc-fg)]">{titulo}</h2>
        </DccTooltip>
        <div className="flex flex-wrap items-center gap-2">
          {calidad ? <SelloCalidad calidad={calidad} tecnico={tecnico} /> : null}
          {acciones}
        </div>
      </header>
      {children ? <div className="mt-3">{children}</div> : null}
      {evidencia ? (
        <details data-testid="dcc-evidencia" className="group mt-4 border-t border-[var(--dcc-border-strong)] pt-3">
          <summary className={`flex cursor-pointer list-none items-center gap-1 text-xs font-medium ${DCC_CLASSES.muted}`}>
            <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden="true" />
            Ver evidencia
          </summary>
          <div className={`mt-2 text-xs ${DCC_CLASSES.muted}`}>{evidencia}</div>
        </details>
      ) : null}
    </section>
  );
}
