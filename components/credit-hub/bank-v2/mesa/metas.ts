import type { MonthlyGoalItem } from "@/lib/credit-hub/types/goals";
import { formatEntero, formatMonedaCompacta, type LocaleTenant } from "@/lib/dcc/formato";
import { porcentaje } from "../comun/formato";

/**
 * Metas del mes del banco v2: lo que el panel antiguo mostraba y el nuevo no
 * (dias restantes, meta con comparador y avance), mas el ritmo esperado a la
 * fecha. Todo es calendario y aritmetica sobre lo que dio goals/monthly; no
 * hay consulta nueva ni dato inventado: sin valor, no hay comparacion.
 */

type Tipo = "proporcion" | "horas" | "moneda" | "conteo";

function tipo(unidad: string): Tipo {
  const u = unidad.toLowerCase();
  if (u === "ratio") return "proporcion";
  if (u === "hours" || u === "hour") return "horas";
  if (u === "dop" || u === "currency") return "moneda";
  return "conteo";
}

function horas(v: number, f: LocaleTenant): string {
  return `${new Intl.NumberFormat(f.locale, { maximumFractionDigits: 1 }).format(v)} h`;
}

/** Valor de una meta segun su unidad, con la moneda del branding (nunca RD$ fijo). */
export function valorMeta(v: number | null | undefined, unidad: string, f: LocaleTenant): string | null {
  const t = tipo(unidad);
  if (t === "proporcion") return porcentaje(v, f);
  if (t === "horas") return typeof v === "number" && Number.isFinite(v) ? horas(v, f) : null;
  if (t === "moneda") return formatMonedaCompacta(v, f);
  return formatEntero(v, f);
}

/** "≥ 80 %" o "≤ 6 h": la meta con su sentido (las horas, cuanto menos mejor). */
export function objetivoMeta(m: MonthlyGoalItem, f: LocaleTenant): string | null {
  const v = valorMeta(m.target_value, m.unit, f);
  if (!v) return null;
  return `${tipo(m.unit) === "horas" ? "≤" : "≥"} ${v}`;
}

const finito = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * Comparacion con la meta en llano. Proporcion: puntos por encima/debajo.
 * Horas: por debajo/encima del maximo. Acumulables (conteo, monto): % de la meta.
 */
export function comparacionMeta(m: MonthlyGoalItem, f: LocaleTenant): string | null {
  if (!finito(m.current_value) || !finito(m.target_value)) return null;
  const t = tipo(m.unit);
  const diff = m.current_value - m.target_value;
  if (t === "proporcion") {
    const puntos = new Intl.NumberFormat(f.locale, { maximumFractionDigits: 1 }).format(Math.abs(diff * 100));
    if (diff === 0) return "En la meta";
    return `${puntos} ${Math.abs(diff * 100) === 1 ? "punto" : "puntos"} ${diff > 0 ? "por encima" : "por debajo"} de la meta`;
  }
  if (t === "horas") {
    if (diff === 0) return "Justo en el máximo";
    return `${horas(Math.abs(diff), f)} ${diff < 0 ? "por debajo" : "por encima"} del máximo`;
  }
  if (m.target_value <= 0) return null;
  return `${porcentaje(m.current_value / m.target_value, f)} de la meta`;
}

/** Dias que quedan del mes del periodo, o null si el periodo no es el mes en curso. */
export function diasRestantes(periodo: string, ahora: Date): number | null {
  const [y, mes] = periodo.split("-").map(Number);
  if (y !== ahora.getFullYear() || mes !== ahora.getMonth() + 1) return null;
  const ultimo = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  return Math.max(0, ultimo - ahora.getDate());
}

/**
 * Ritmo esperado a hoy para metas acumulables (conteo, monto) del mes en
 * curso: la parte del mes transcurrida. Proporciones y horas no se acumulan:
 * no tienen ritmo.
 */
export function ritmoMeta(m: MonthlyGoalItem, periodo: string, ahora: Date, f: LocaleTenant): string | null {
  const t = tipo(m.unit);
  if (t === "proporcion" || t === "horas" || diasRestantes(periodo, ahora) === null) return null;
  const total = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  return `Ritmo esperado a hoy: ${porcentaje(ahora.getDate() / total, f)}`;
}

export type EstadoMeta = "cumplido" | "en camino" | "atrasado";

/**
 * Estado de la meta. En acumulables del mes en curso se compara con el ritmo
 * esperado a hoy (una meta al 30 % el dia 7 va en camino); en el resto se
 * conserva el estado del panel actual (presentMonthlyGoal).
 */
export function estadoMeta(m: MonthlyGoalItem, periodo: string, ahora: Date, estadoActual: EstadoMeta): EstadoMeta {
  const t = tipo(m.unit);
  if (t === "proporcion" || t === "horas" || diasRestantes(periodo, ahora) === null) return estadoActual;
  if (!finito(m.current_value) || !finito(m.target_value) || m.target_value <= 0) return estadoActual;
  if (m.current_value >= m.target_value) return "cumplido";
  const total = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  return m.current_value / m.target_value >= ahora.getDate() / total ? "en camino" : "atrasado";
}
