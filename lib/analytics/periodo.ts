import type { PeriodoAnalitica } from "./cifra";

export const OPCIONES_PERIODO = [
  { tipo: "7d", etiqueta: "7 días" },
  { tipo: "30d", etiqueta: "30 días" },
  { tipo: "90d", etiqueta: "90 días" },
  { tipo: "personalizado", etiqueta: "Personalizado" },
] as const;

export type TipoPeriodo = (typeof OPCIONES_PERIODO)[number]["tipo"];

export function periodoDeTipo(tipo: TipoPeriodo, previo?: PeriodoAnalitica): PeriodoAnalitica {
  if (tipo !== "personalizado") return { tipo };
  return previo && previo.tipo === "personalizado" ? previo : { tipo: "personalizado", desde: "", hasta: "" };
}

/** Rango personalizado valido: ambas fechas presentes y desde <= hasta (ISO YYYY-MM-DD ordena como texto). */
export function rangoValido(desde: string, hasta: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(desde) && /^\d{4}-\d{2}-\d{2}$/.test(hasta) && desde <= hasta;
}
