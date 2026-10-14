"use client";

import { ChevronDown } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import type { NotaTecnica } from "./llano";

/**
 * Bloque plegado al pie de la pagina con el porque tecnico de cada
 * "Próximamente" (endpoint, campo, flag). Cerrado por defecto: el banco lee
 * frases llanas y quien da soporte despliega esto. Sin notas no se pinta.
 */
export function DetalleTecnico({ notas }: { notas: NotaTecnica[] }) {
  if (notas.length === 0) return null;
  return (
    <details data-testid="detalle-tecnico" className="group rounded-lg border border-[var(--dcc-border)] bg-[var(--dcc-surface)]">
      <summary className={`flex cursor-pointer list-none items-center gap-1 px-3 py-2 text-xs font-semibold ${DCC_CLASSES.muted}`}>
        <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden="true" />
        Detalle técnico
      </summary>
      <ul className={`grid gap-1.5 border-t border-[var(--dcc-border)] px-3 py-3 text-xs ${DCC_CLASSES.subtle}`}>
        {notas.map((n) => (
          <li key={`${n.que}-${n.detalle}`}>
            <span className="font-semibold">{n.que}:</span> <span className="font-mono">{n.detalle}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
