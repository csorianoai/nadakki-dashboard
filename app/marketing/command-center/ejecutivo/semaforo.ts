/**
 * Logica pura del semaforo economico de la pantalla. Reglas duras: nunca NaN/Infinity;
 * sin CPA, sin objetivo o sin equilibrio validos => "datos_insuficientes"; menos de MIN_CONVERSIONES => muestra pequena.
 * No calcula rentabilidad: solo ubica un CPA ya calculado frente a objetivo y equilibrio.
 */
import type { LecturaCampana } from "./tipos";

/** Menos de este numero de conversiones: sin CPA ni juicio de rentabilidad (texto del diseno aprobado). */
export const MIN_CONVERSIONES = 5;

const fin = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);

export function clasificarCpa(cpa: number | null, objetivo: number | null, equilibrio: number | null): LecturaCampana {
  if (!fin(cpa) || !fin(objetivo) || !fin(equilibrio) || objetivo <= 0 || equilibrio <= 0 || equilibrio < objetivo) return "datos_insuficientes";
  if (cpa <= objetivo) return "bajo_objetivo";
  if (cpa <= equilibrio) return "entre_objetivo_equilibrio";
  return "sobre_equilibrio";
}

export function muestraPequena(conversiones: number | null): boolean {
  return !fin(conversiones) || conversiones < MIN_CONVERSIONES * 3;
}

export interface GeometriaBarra {
  /** 0..100 */
  objetivoPct: number;
  equilibrioPct: number;
  marcadorPct: number;
  maximo: number;
}

/** Escala de la barra: de 0 a 4/3 del equilibrio (como el diseno: 0-100 con equilibrio en 75). El marcador se acota a [0,100]. */
export function geometriaBarra(cpa: number | null, objetivo: number | null, equilibrio: number | null): GeometriaBarra | null {
  if (!fin(cpa) || !fin(objetivo) || !fin(equilibrio) || equilibrio <= 0 || objetivo <= 0) return null;
  const maximo = (equilibrio * 4) / 3;
  const pct = (v: number) => Math.min(100, Math.max(0, (v / maximo) * 100));
  return { objetivoPct: pct(objetivo), equilibrioPct: pct(equilibrio), marcadorPct: pct(cpa), maximo };
}

export const ETIQUETA_LECTURA: Record<LecturaCampana, string> = {
  bajo_objetivo: "Bajo objetivo",
  entre_objetivo_equilibrio: "Entre objetivo y equilibrio",
  sobre_equilibrio: "Sobre el equilibrio",
  datos_insuficientes: "Datos insuficientes",
};

/** Frescura: el dato es "desactualizado" si tiene mas de `umbralHoras` respecto de `ahora`. Fechas invalidas => desactualizado. */
export function estaDesactualizado(actualizado: string | null | undefined, ahora: string, umbralHoras = 36): boolean {
  const a = actualizado ? Date.parse(actualizado) : NaN;
  const n = Date.parse(ahora);
  if (!Number.isFinite(a) || !Number.isFinite(n)) return true;
  return n - a > umbralHoras * 3_600_000;
}
