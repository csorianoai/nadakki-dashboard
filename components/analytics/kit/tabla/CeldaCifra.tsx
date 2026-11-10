"use client";

import { estadoEfectivo, formatearFecha, formatearValor, type Cifra, type EstadoCifra } from "@/lib/analytics/cifra";
import { cn } from "@/lib/utils";

/**
 * Un nivel por cada escala de calor (0..4). Solo tokens forge; el VALOR siempre va escrito: el color no es la unica pista.
 * Contraste medido sobre los tokens por defecto (styles/forge-tokens-v2.css): texto forgeGray-900 sobre brand-50..300 da
 * 16.2, 14.2, 10.5 y 7.1:1; el nivel 4 usa brand-700 con texto blanco (brand-400 con gray-900 daba 4.49:1, bajo AA).
 */
const CLASES_CALOR = [
  "bg-forgeBrand-50 text-forgeGray-900",
  "bg-forgeBrand-100 text-forgeGray-900",
  "bg-forgeBrand-200 text-forgeGray-900",
  "bg-forgeBrand-300 text-forgeGray-900",
  "bg-forgeBrand-700 text-white",
] as const;

const TEXTO_ESTADO: Record<Exclude<EstadoCifra, "ok">, string> = {
  datos_insuficientes: "Datos insuficientes",
  pendiente_integracion: "Pendiente de integración",
  cargando: "Cargando",
  error: "Error al cargar",
  vacio: "Sin datos",
};

export interface CeldaCifraProps {
  cifra: Cifra;
  /** Nivel de calor 0..4; undefined = la columna no lleva calor. */
  nivel?: number | null;
  className?: string;
}

/** Valor de una cifra dentro de una celda/tarjeta. Aplica las reglas duras: sin fuente+fecha o sin valor no hay cifra. */
export function CeldaCifra({ cifra, nivel, className }: CeldaCifraProps) {
  const estado = estadoEfectivo(cifra);
  if (estado !== "ok") {
    return (
      <span data-estado={estado} className={cn("text-forge-xs text-forgeGray-600", className)}>
        {TEXTO_ESTADO[estado]}
      </span>
    );
  }
  const fecha = formatearFecha(cifra.fecha_dato);
  const conCalor = typeof nivel === "number";
  return (
    <span
      {...(conCalor ? { "data-calor": String(nivel) } : {})}
      title={`Fuente: ${cifra.fuente} · dato al ${fecha}`}
      className={cn(
        "inline-block max-w-full break-words tabular-nums",
        conCalor && ["rounded-forge-sm px-2 py-0.5", CLASES_CALOR[Math.min(Math.max(nivel as number, 0), CLASES_CALOR.length - 1)]],
        className
      )}
    >
      <span>{formatearValor(cifra)}</span>
      <span className="sr-only">{`Fuente: ${cifra.fuente}, dato al ${fecha}`}</span>
    </span>
  );
}
