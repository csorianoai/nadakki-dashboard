/**
 * Modelo unico de cifra de Nadakki Analytics (Ola 0).
 * Regla dura: una cifra sin fuente o sin fecha del dato NO se muestra como dato ("pendiente de integracion").
 * Regla dura: nunca Infinity/NaN; una division por cero o un periodo anterior nulo es "datos insuficientes".
 */

import {
  FORMATO_POR_DEFECTO,
  formatearDias,
  formatearFecha as fechaDe,
  formatearMoneda,
  formatearNumero,
  formatearPorcentaje as porcentajeDe,
  type FormatoTenant,
} from "./formato";

export type EstadoCifra = "ok" | "cargando" | "error" | "vacio" | "datos_insuficientes" | "pendiente_integracion";

export type UnidadCifra = "numero" | "moneda" | "porcentaje" | "duracion_dias";

export type PeriodoAnalitica =
  | { tipo: "7d" | "30d" | "90d" }
  | { tipo: "personalizado"; desde: string; hasta: string };

export interface Cifra {
  id: string;
  etiqueta: string;
  valor: number | null;
  /** Valor del periodo inmediatamente anterior, del mismo largo. La variacion se DERIVA de aqui. */
  valor_anterior: number | null;
  unidad: UnidadCifra;
  /** Codigo ISO 4217; solo para unidad "moneda". */
  moneda?: string;
  periodo: PeriodoAnalitica;
  /** Origen del dato (tabla, endpoint o sistema). Sin fuente la cifra no se muestra. */
  fuente: string | null;
  /** Fecha del dato en ISO (YYYY-MM-DD o ISO completo). Sin fecha la cifra no se muestra. */
  fecha_dato: string | null;
  estado: EstadoCifra;
  /** Si una subida es mejora ("sube", por defecto) o empeora ("baja", p. ej. costo por lead). */
  mejor_si?: "sube" | "baja";
  mensaje?: string;
}

export type Variacion =
  | { estado: "ok"; porcentaje: number; direccion: "up" | "down" | "neutral" }
  | { estado: "datos_insuficientes" };

const finito = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);

export function calcularVariacion(actual: number | null | undefined, anterior: number | null | undefined): Variacion {
  if (!finito(actual) || !finito(anterior) || anterior === 0) return { estado: "datos_insuficientes" };
  const bruto = ((actual - anterior) / Math.abs(anterior)) * 100;
  if (!Number.isFinite(bruto)) return { estado: "datos_insuficientes" };
  const porcentaje = Math.round(bruto * 10) / 10;
  const direccion = porcentaje > 0 ? "up" : porcentaje < 0 ? "down" : "neutral";
  return { estado: "ok", porcentaje: porcentaje === 0 ? 0 : porcentaje, direccion };
}

/** Estado con el que se debe pintar la cifra, aplicando las reglas duras sobre el declarado. */
export function estadoEfectivo(c: Cifra): EstadoCifra {
  if (c.estado !== "ok") return c.estado;
  if (!c.fuente || !c.fuente.trim() || !c.fecha_dato || formatearFecha(c.fecha_dato) === null) return "pendiente_integracion";
  if (!finito(c.valor)) return "datos_insuficientes";
  return "ok";
}

/** "2026-11-10" -> fecha corta en el locale del tenant (por defecto es-US). null si no es fecha. */
export function formatearFecha(iso: string | null | undefined, f: FormatoTenant = FORMATO_POR_DEFECTO): string | null {
  return fechaDe(iso, f);
}

/** `n` en puntos porcentuales (1,5 = 1,5 %), con la forma del locale del tenant. */
export function formatearPorcentaje(n: number, decimales = 1, f: FormatoTenant = FORMATO_POR_DEFECTO): string {
  return porcentajeDe(n, f, decimales);
}

/** Valor de la cifra con el formato del tenant. La moneda propia de la cifra, si la trae, manda sobre la del tenant. */
export function formatearValor(c: Pick<Cifra, "valor" | "unidad" | "moneda">, f: FormatoTenant = FORMATO_POR_DEFECTO): string {
  if (!finito(c.valor)) return "—";
  switch (c.unidad) {
    case "porcentaje":
      return formatearPorcentaje(c.valor, 1, f);
    case "moneda":
      return formatearMoneda(c.valor, f, c.moneda);
    case "duracion_dias":
      return formatearDias(c.valor, f);
    default:
      return formatearNumero(c.valor, f, 2);
  }
}
