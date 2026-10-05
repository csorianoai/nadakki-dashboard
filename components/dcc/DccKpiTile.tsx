"use client";

import { permiteCifra, type Calidad } from "@/lib/dcc/calidad";
import { DCC_CLASSES } from "./clases";
import { DccTooltip } from "./DccTooltip";
import { SelloCalidad } from "./SelloCalidad";

/**
 * KPI compacto de la fila "Estado del negocio" (referencia v3): etiqueta,
 * cifra en dorado legible + unidad, sello y nota. `valor` llega ya formateado
 * desde lo que dio el backend; aqui no se calcula nada. Sin cifra permitida,
 * el mosaico se queda en etiqueta + sello "Próximamente": no ocupa mas.
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
  return (
    <div data-testid={testId ?? "dcc-kpi-tile"} data-con-cifra={conCifra ? "si" : "no"} className="h-auto min-w-0 py-1">
      <DccTooltip contenido={tecnico}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${DCC_CLASSES.muted}`}>{etiqueta}</p>
      </DccTooltip>
      {conCifra ? (
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
          <span data-testid="dcc-kpi-valor" className={`${DCC_CLASSES.cifra} text-2xl`}>
            {valor}
          </span>
          {unidad ? <span className={`text-xs ${DCC_CLASSES.subtle}`}>{unidad}</span> : null}
        </p>
      ) : null}
      <div className="mt-1.5">
        <SelloCalidad calidad={calidad} tecnico={tecnico} />
      </div>
      {conCifra && nota ? <p className={`mt-1 text-xs ${DCC_CLASSES.subtle}`}>{nota}</p> : null}
    </div>
  );
}
