/**
 * Modelo unico de cifra de Nadakki Analytics (Ola 0).
 * Regla dura: una cifra sin fuente o sin fecha del dato NO se muestra como dato ("pendiente de integracion").
 * Regla dura: nunca Infinity/NaN; una division por cero o un periodo anterior nulo es "datos insuficientes".
 */

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

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-11-10" -> "10 nov 2026". Determinista (UTC), sin depender de la zona horaria ni del ICU. */
export function formatearFecha(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatearPorcentaje(n: number, decimales = 1): string {
  return `${n.toLocaleString("es", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;
}

export function formatearValor(c: Pick<Cifra, "valor" | "unidad" | "moneda">): string {
  if (!finito(c.valor)) return "—";
  switch (c.unidad) {
    case "porcentaje":
      return formatearPorcentaje(c.valor, 1);
    case "moneda": {
      try {
        return c.valor.toLocaleString("es", { style: "currency", currency: c.moneda ?? "USD", maximumFractionDigits: 2 });
      } catch {
        return c.valor.toLocaleString("es", { maximumFractionDigits: 2 });
      }
    }
    case "duracion_dias":
      return `${c.valor.toLocaleString("es", { maximumFractionDigits: 1 })} d`;
    default:
      return c.valor.toLocaleString("es", { maximumFractionDigits: 2 });
  }
}
