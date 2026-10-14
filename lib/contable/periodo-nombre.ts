/**
 * Nombre y estado de un periodo contable, a partir de lo que trae la tabla.
 *
 * `contable_periodos` NO tiene columna de nombre: tiene fiscal_year,
 * period_number, start_date, end_date y status (auditoria Mapaal QA, P1). El
 * panel leia `label` --que no existe-- y pintaba el periodo en blanco en Libro
 * mayor, Periodos y Balance, y en Balance solo quedaba "(open)".
 *
 * El nombre se construye con los datos y nada mas:
 *   1. Si el backend algun dia manda `label`, manda el backend.
 *   2. Inicio y fin en el mismo mes  -> "Julio 2026".
 *   3. Si no, numero y ejercicio      -> "Período 7 · 2026".
 *   4. Sin datos con que construirlo  -> "Período sin fechas". Nunca un mes
 *      supuesto: el periodo 7 no es julio si el ejercicio empieza en abril.
 */

import type { PeriodoStatus } from "@/types/contable";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

const FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Anio y mes (1-12) de una fecha ISO "aaaa-mm-dd". Lo que no lo es, null. */
function anioMes(fecha: string | null | undefined): { anio: number; mes: number } | null {
  const m = FECHA_ISO.exec((fecha ?? "").trim().slice(0, 10));
  if (!m) return null;
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return { anio: Number(m[1]), mes };
}

export interface DatosNombrePeriodo {
  label?: string | null;
  fiscal_year?: number | null;
  period_number?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

export function nombrePeriodo(p: DatosNombrePeriodo): string {
  const label = p.label?.trim();
  if (label) return label;

  const inicio = anioMes(p.fecha_inicio);
  const fin = anioMes(p.fecha_fin);
  if (inicio && fin && inicio.anio === fin.anio && inicio.mes === fin.mes) {
    return `${MESES[inicio.mes - 1]} ${inicio.anio}`;
  }

  const numero = Number(p.period_number);
  const ejercicio = Number(p.fiscal_year);
  if (Number.isInteger(numero) && numero > 0 && Number.isInteger(ejercicio) && ejercicio > 0) {
    return `Período ${numero} · ${ejercicio}`;
  }

  return "Período sin fechas";
}

export const ESTADO_PERIODO_LABEL: Record<PeriodoStatus, string> = {
  open: "Abierto",
  soft_closed: "Cierre suave",
  locked: "Cerrado",
};

/** Estado legible. Uno que el panel no conoce se muestra tal cual: no se traduce a ciegas. */
export function estadoPeriodo(status: string): string {
  return ESTADO_PERIODO_LABEL[status as PeriodoStatus] ?? status;
}

/** Texto de la opcion en los selectores de periodo: "Julio 2026 (abierto)". */
export function opcionPeriodo(p: { label: string; status: string }): string {
  return `${p.label} (${estadoPeriodo(p.status).toLowerCase()})`;
}
