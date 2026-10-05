"use client";

import { permiteCifra, type Calidad } from "@/lib/dcc/calidad";
import { DCC_CLASSES } from "./clases";
import { DccEstado } from "./DccEstado";

/**
 * Cifra principal de una tarjeta. `valor` llega YA formateado desde lo que
 * devolvio el backend; aqui no se calcula nada. Si el sello no permite cifra
 * (bloqueado / no disponible) o no hay valor, se pinta el estado, nunca un 0.
 */
export function DccKpi({ valor, calidad, nota }: { valor: string | null; calidad: Calidad; nota?: string | null }) {
  if (calidad.estado === "bloqueado") return <DccEstado estado="bloqueado" />;
  // Sin dato: el sello "Próximamente" de la cabecera basta; la tarjeta no crece.
  if (calidad.estado === "no_disponible") return null;
  if (!permiteCifra(calidad) || valor === null) return <DccEstado estado="no_disponible" />;
  return (
    <div>
      <p data-testid="dcc-kpi-valor" className={`${DCC_CLASSES.cifra} text-3xl tracking-tight`}>
        {valor}
      </p>
      {nota ? <p className={`mt-1 text-xs ${DCC_CLASSES.subtle}`}>{nota}</p> : null}
    </div>
  );
}
