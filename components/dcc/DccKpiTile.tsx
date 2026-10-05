"use client";

import { CircleDashed, Lock } from "lucide-react";
import { permiteCifra, type Calidad } from "@/lib/dcc/calidad";
import { DCC_CLASSES } from "./clases";
import { DccTooltip } from "./DccTooltip";
import { SelloCalidad } from "./SelloCalidad";

/**
 * Mosaico de KPI de "Estado del negocio" (referencia v3): filete superior,
 * etiqueta en versalitas, cifra + unidad, sello y nota. `valor` llega ya
 * formateado desde lo que dio el backend; aqui no se calcula nada. Sin cifra
 * permitida, el mosaico dice "cifra no disponible" y nunca pinta un numero.
 */
export function DccKpiTile({
  etiqueta,
  valor,
  unidad,
  calidad,
  nota,
  tecnico,
  testId,
}: {
  etiqueta: string;
  valor: string | null;
  unidad?: string | null;
  calidad: Calidad;
  nota?: string | null;
  tecnico?: string | null;
  testId?: string;
}) {
  const conCifra = permiteCifra(calidad) && valor !== null;
  const Icono = calidad.estado === "bloqueado" ? Lock : CircleDashed;
  return (
    <div
      data-testid={testId ?? "dcc-kpi-tile"}
      data-con-cifra={conCifra ? "si" : "no"}
      className={`h-auto min-w-0 rounded-[10px] border border-[var(--dcc-border)] border-t-[3px] bg-[var(--dcc-surface)] p-4 ${
        conCifra ? "border-t-[var(--dcc-action)]" : "border-t-[var(--dcc-border-strong)] bg-[var(--dcc-surface-muted)]"
      }`}
    >
      <DccTooltip contenido={tecnico}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${DCC_CLASSES.muted}`}>{etiqueta}</p>
      </DccTooltip>
      {conCifra ? (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span data-testid="dcc-kpi-valor" className="font-dealer-numeric text-2xl font-semibold text-[var(--dcc-fg)]">
            {valor}
          </span>
          {unidad ? <span className={`text-xs ${DCC_CLASSES.subtle}`}>{unidad}</span> : null}
        </p>
      ) : (
        <p className={`mt-2 flex items-center gap-1.5 text-sm ${DCC_CLASSES.muted}`}>
          <Icono className="h-4 w-4" aria-hidden="true" />
          cifra no disponible
        </p>
      )}
      <div className="mt-2">
        <SelloCalidad calidad={calidad} tecnico={tecnico} />
      </div>
      {nota ? <p className={`mt-2 text-xs ${DCC_CLASSES.subtle}`}>{nota}</p> : null}
    </div>
  );
}
