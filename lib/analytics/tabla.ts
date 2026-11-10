/**
 * Utilidades puras de la tabla de analitica (orden, paginacion, escala de calor, normalizacion de texto).
 * Sin dependencias de React. Regla dura: nunca NaN/Infinity ni division por cero.
 */

import { comparadorTexto, FORMATO_POR_DEFECTO, type FormatoTenant } from "./formato";

export type Direccion = "asc" | "desc";

export const NIVELES_CALOR = 5;

const numeroFinito = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Minusculas, sin acentos y sin espacios en los bordes: para comparar texto de filtros. */
export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}


type Clave = string | number | null | undefined;

const esNulo = (k: Clave): k is null | undefined => k === null || k === undefined || (typeof k === "number" && !Number.isFinite(k));

/**
 * Orden estable. Las claves nulas (o NaN/Infinity) van SIEMPRE al final, ascendente o descendente.
 * No muta la entrada.
 */
export function ordenarPor<R>(filas: readonly R[], clave: (fila: R) => Clave, direccion: Direccion, formato: FormatoTenant = FORMATO_POR_DEFECTO): R[] {
  const colador = comparadorTexto(formato);
  const signo = direccion === "asc" ? 1 : -1;
  return filas
    .map((fila, indice) => ({ fila, indice, k: clave(fila) }))
    .sort((a, b) => {
      const an = esNulo(a.k);
      const bn = esNulo(b.k);
      if (an || bn) return an && bn ? a.indice - b.indice : an ? 1 : -1;
      let cmp: number;
      if (typeof a.k === "number" && typeof b.k === "number") cmp = a.k - b.k;
      else cmp = colador.compare(String(a.k), String(b.k));
      return cmp !== 0 ? cmp * signo : a.indice - b.indice;
    })
    .map((x) => x.fila);
}

export interface Pagina<T> {
  items: T[];
  pagina: number;
  paginas: number;
  total: number;
  /** 1-based; 0 si no hay filas. */
  desde: number;
  hasta: number;
}

export function paginar<T>(items: readonly T[], pagina: number, tamano: number): Pagina<T> {
  const total = items.length;
  const t = Number.isFinite(tamano) && tamano >= 1 ? Math.floor(tamano) : Math.max(total, 1);
  const paginas = Math.max(1, Math.ceil(total / t));
  const p = Number.isFinite(pagina) ? Math.min(Math.max(1, Math.floor(pagina)), paginas) : 1;
  const inicio = (p - 1) * t;
  const cortados = items.slice(inicio, inicio + t);
  return {
    items: cortados,
    pagina: p,
    paginas,
    total,
    desde: total === 0 ? 0 : inicio + 1,
    hasta: total === 0 ? 0 : inicio + cortados.length,
  };
}

/** Minimo y maximo de los valores finitos; null si no hay ninguno. */
export function rangoCalor(valores: ReadonlyArray<number | null | undefined>): { min: number; max: number } | null {
  const finitos = valores.filter(numeroFinito);
  if (finitos.length === 0) return null;
  return { min: Math.min(...finitos), max: Math.max(...finitos) };
}

/**
 * Nivel de calor 0..niveles-1. null si el valor no es finito. Si max <= min no hay gradiente: nivel 0.
 * Valores fuera de rango se acotan.
 */
export function nivelCalor(valor: number | null | undefined, min: number, max: number, niveles = NIVELES_CALOR): number | null {
  if (!numeroFinito(valor) || !numeroFinito(min) || !numeroFinito(max)) return null;
  const amplitud = max - min;
  if (!(amplitud > 0)) return 0;
  const t = Math.min(1, Math.max(0, (valor - min) / amplitud));
  return Math.min(niveles - 1, Math.floor(t * niveles));
}
