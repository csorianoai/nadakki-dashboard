/**
 * Utilidades puras de los graficos del kit de analitica (Ola 0, PR 2).
 * Reglas duras: sin NaN/Infinity en ninguna salida; division por cero => "datos insuficientes";
 * un grafico sin fuente o sin fecha del dato es "pendiente de integracion", nunca un dato.
 */
import { formatearFecha, type EstadoCifra } from "./cifra";

/** Metadatos comunes: titulo, procedencia del dato y estado declarado por quien consume. */
export interface MetaGrafico {
  titulo: string;
  descripcion?: string;
  /** Origen del dato (tabla, endpoint o sistema). Sin fuente el grafico no se muestra. */
  fuente: string | null;
  /** Fecha del dato (ISO). Sin fecha valida el grafico no se muestra. */
  fecha_dato: string | null;
  /** Estado declarado; distinto de "ok" manda sobre los datos. */
  estado?: EstadoCifra;
  mensaje?: string;
}

export interface PuntoSerie {
  /** Fecha ISO o etiqueta de texto. */
  x: string;
  y: number | null;
}

export interface DatoCategoria {
  etiqueta: string;
  valor: number | null;
}

export interface EtapaEmbudo {
  etiqueta: string;
  valor: number | null;
}

export interface PuntoDispersion {
  id: string;
  etiqueta: string;
  x: number | null;
  y: number | null;
}

export type Porcentaje = { estado: "ok"; porcentaje: number } | { estado: "datos_insuficientes" };

const finito = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);
export const esFinito = finito;

/** Estado con el que debe pintarse el grafico. `n` = cantidad de datos validos; `minimo` = lo necesario para dibujar. */
export function estadoGrafico(meta: MetaGrafico, n: number, minimo = 1): EstadoCifra {
  if (meta.estado && meta.estado !== "ok") return meta.estado;
  if (!meta.fuente || !meta.fuente.trim() || !meta.fecha_dato || formatearFecha(meta.fecha_dato) === null) return "pendiente_integracion";
  if (n <= 0) return "vacio";
  if (n < minimo) return "datos_insuficientes";
  return "ok";
}

/** Interpola `v` de `dominio` a `rango`. Dominio plano => punto medio. Nunca NaN. */
export function escalar(v: number, dominio: [number, number], rango: [number, number]): number {
  const [d0, d1] = dominio;
  const [r0, r1] = rango;
  if (!finito(v) || !finito(d0) || !finito(d1)) return (r0 + r1) / 2;
  if (d0 === d1) return (r0 + r1) / 2;
  const t = (v - d0) / (d1 - d0);
  return r0 + t * (r1 - r0);
}

/** Marcas "redondas" (1/2/5 x 10^k) que cubren [min, max]; incluyen el cero si el rango lo cruza. */
export function ticksLineales(min: number, max: number, n = 4): number[] {
  let lo = finito(min) ? min : 0;
  let hi = finito(max) ? max : 0;
  if (lo > hi) [lo, hi] = [hi, lo];
  if (lo === hi) {
    const margen = lo === 0 ? 1 : Math.abs(lo) * 0.5;
    lo -= margen;
    hi += margen;
  }
  const crudo = (hi - lo) / Math.max(1, n);
  const potencia = 10 ** Math.floor(Math.log10(crudo));
  const fraccion = crudo / potencia;
  const paso = (fraccion <= 1 ? 1 : fraccion <= 2 ? 2 : fraccion <= 5 ? 5 : 10) * potencia;
  const inicio = Math.floor(lo / paso) * paso;
  const fin = Math.ceil(hi / paso) * paso;
  const ticks: number[] = [];
  for (let t = inicio, i = 0; t <= fin + paso / 2 && i < 50; t += paso, i += 1) {
    ticks.push(Math.round(t / paso) * paso === 0 ? 0 : Number((Math.round(t / paso) * paso).toPrecision(12)));
  }
  return ticks;
}

/** Ruta SVG de una polilinea; un `null` rompe la linea. Un tramo de un solo punto no genera ruta. */
export function rutaLinea(puntos: Array<{ x: number; y: number } | null>): string {
  const tramos: Array<Array<{ x: number; y: number }>> = [];
  let actual: Array<{ x: number; y: number }> = [];
  for (const p of puntos) {
    if (p && finito(p.x) && finito(p.y)) actual.push(p);
    else {
      if (actual.length) tramos.push(actual);
      actual = [];
    }
  }
  if (actual.length) tramos.push(actual);
  return tramos
    .filter((t) => t.length >= 2)
    .map((t) => t.map((p, i) => `${i === 0 ? "M" : "L"}${redondear(p.x)} ${redondear(p.y)}`).join(" "))
    .join(" ");
}

export function redondear(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export function ordenarCategorias<T extends DatoCategoria>(datos: readonly T[]): T[] {
  return [...datos].sort((a, b) => {
    const va = finito(a.valor) ? a.valor : Number.NEGATIVE_INFINITY;
    const vb = finito(b.valor) ? b.valor : Number.NEGATIVE_INFINITY;
    return vb - va;
  });
}

/** Para partes de un todo: solo valores finitos y > 0; el resto se descarta (y se cuenta). Excedente => "Otros". */
export function agruparTopN(datos: readonly DatoCategoria[], max: number): { items: Array<{ etiqueta: string; valor: number }>; descartados: number } {
  const validos = datos.filter((d): d is { etiqueta: string; valor: number } => finito(d.valor) && d.valor > 0);
  const descartados = datos.length - validos.length;
  const orden = ordenarCategorias(validos) as Array<{ etiqueta: string; valor: number }>;
  if (orden.length <= max) return { items: orden, descartados };
  const top = orden.slice(0, Math.max(1, max));
  const resto = orden.slice(top.length).reduce((s, d) => s + d.valor, 0);
  return { items: [...top, { etiqueta: "Otros", valor: resto }], descartados };
}

export interface FilaEmbudo {
  etiqueta: string;
  valor: number | null;
  /** null en la primera etapa (no hay anterior). */
  conversion_previa: Porcentaje | null;
  porcentaje_inicio: Porcentaje;
  /** La etapa supera a la anterior: la definicion de etapas o el dato merecen revision. */
  anomalia: boolean;
}

function pct(parte: number | null, todo: number | null): Porcentaje {
  if (!finito(parte) || !finito(todo) || todo === 0) return { estado: "datos_insuficientes" };
  const p = (parte / todo) * 100;
  if (!Number.isFinite(p)) return { estado: "datos_insuficientes" };
  return { estado: "ok", porcentaje: Math.round(p * 10) / 10 };
}

export function calcularEmbudo(etapas: readonly EtapaEmbudo[]): { filas: FilaEmbudo[]; total: Porcentaje } {
  const filas = etapas.map((e, i) => {
    const previa = i > 0 ? etapas[i - 1].valor : null;
    const valor = finito(e.valor) ? e.valor : null;
    const conversion_previa = i === 0 ? null : pct(valor, finito(previa) ? previa : null);
    const anomalia = i > 0 && finito(valor) && finito(previa) && valor > previa;
    return { etiqueta: e.etiqueta, valor, conversion_previa, porcentaje_inicio: pct(valor, finito(etapas[0]?.valor) ? etapas[0].valor : null), anomalia };
  });
  const total: Porcentaje = etapas.length < 2 ? { estado: "datos_insuficientes" } : pct(finito(etapas[etapas.length - 1].valor) ? etapas[etapas.length - 1].valor : null, finito(etapas[0].valor) ? etapas[0].valor : null);
  return { filas, total };
}

/** "2026-11-10" -> "10 nov". Si no es fecha, devuelve el texto tal cual. */
export function etiquetaCorta(x: string): string {
  const f = formatearFecha(x);
  return f ? f.replace(/\s\d{4}$/, "") : x;
}

/** Texto corto de unidad para ejes y rotulos. */
export function etiquetaUnidad(unidad: "numero" | "moneda" | "porcentaje" | "duracion_dias", moneda?: string): string {
  switch (unidad) {
    case "porcentaje":
      return "%";
    case "moneda":
      return moneda ?? "USD";
    case "duracion_dias":
      return "días";
    default:
      return "";
  }
}

/** Margen izquierdo (px) para que las marcas del eje Y (texto de 11 px, ~6,4 px por caracter) no se recorten. */
export function margenIzquierdo(etiquetas: readonly string[], minimo = 40): number {
  const largo = etiquetas.reduce((m, e) => Math.max(m, e.length), 0);
  return Math.max(minimo, Math.ceil(largo * 6.4) + 12);
}
