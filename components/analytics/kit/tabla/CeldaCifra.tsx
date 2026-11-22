"use client";

import "../tema.css";
import { estadoEfectivo, formatearFecha, formatearValor, type Cifra, type EstadoCifra } from "@/lib/analytics/cifra";
import { useFormato } from "../FormatoProvider";
import { cn } from "@/lib/utils";

/**
 * Un nivel por cada escala de calor (0..4), con tokens semanticos del kit (--kit-calor-N y --kit-calor-texto-N, en claro y en
 * oscuro). El VALOR siempre va escrito: el color no es la unica pista. El contraste de cada par lo mide tests/analytics/tema.test.ts.
 */
const CLASES_CALOR = ["kit-calor-0", "kit-calor-1", "kit-calor-2", "kit-calor-3", "kit-calor-4"] as const;

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
  const formato = useFormato();
  const estado = estadoEfectivo(cifra);
  if (estado !== "ok") {
    return (
      <span data-estado={estado} className={cn("text-forge-xs kit-txt-2", className)}>
        {TEXTO_ESTADO[estado]}
      </span>
    );
  }
  const fecha = formatearFecha(cifra.fecha_dato, formato);
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
      <span>{formatearValor(cifra, formato)}</span>
      <span className="sr-only">{`Fuente: ${cifra.fuente}, dato al ${fecha}`}</span>
    </span>
  );
}
