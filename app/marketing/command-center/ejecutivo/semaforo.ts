/**
 * Logica pura del semaforo economico de la pantalla. Reglas duras: nunca NaN/Infinity;
 * sin CPA, sin objetivo o sin equilibrio validos => "datos_insuficientes"; menos de MIN_CONVERSIONES => sin CPA ni juicio.
 *
 * SEMAFORO RESPONSABLE (criterio 3 de Cesar): «CPA por debajo del objetivo» NO es «rentabilidad confirmada».
 *   - Esta pantalla NUNCA confirma rentabilidad: solo ubica un CPA ya calculado frente a objetivo y equilibrio.
 *   - Con muestra pequena (< CONVERSIONES_MUESTRA_CONFIABLE) la lectura es «rendimiento preliminar».
 *   - Mientras no haya cierres reales del CRM, la rentabilidad queda «sin confirmar» (y con cierres, «en revision»).
 */
import type { LecturaCampana } from "./tipos";

/** Menos de este numero de conversiones: sin CPA ni juicio de rentabilidad (texto del diseno aprobado). */
export const MIN_CONVERSIONES = 5;

/**
 * Conversiones minimas para dejar de llamar «preliminar» al rendimiento.
 * PROPUESTA A CONFIRMAR POR CESAR: el diseno V2 solo fija el minimo de 5 (datos insuficientes) y habla de «muestra pequeña»
 * sin cifra; se usa 15 (3 x el minimo) como valor inicial. Es una constante unica: cambiarla aqui cambia semaforo, KPI y textos.
 */
export const CONVERSIONES_MUESTRA_CONFIABLE = MIN_CONVERSIONES * 3;

const fin = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);

export function clasificarCpa(cpa: number | null, objetivo: number | null, equilibrio: number | null): LecturaCampana {
  if (!fin(cpa) || !fin(objetivo) || !fin(equilibrio) || objetivo <= 0 || equilibrio <= 0 || equilibrio < objetivo) return "datos_insuficientes";
  if (cpa <= objetivo) return "bajo_objetivo";
  if (cpa <= equilibrio) return "entre_objetivo_equilibrio";
  return "sobre_equilibrio";
}

export function muestraPequena(conversiones: number | null): boolean {
  return !fin(conversiones) || conversiones < CONVERSIONES_MUESTRA_CONFIABLE;
}

/** Estado de la rentabilidad. Nunca «confirmada»: esta pantalla no tiene con que confirmarla. */
export type EstadoRentabilidad = "sin_confirmar" | "en_revision";

export interface EntradaRendimiento {
  cpa: number | null;
  objetivo: number | null;
  equilibrio: number | null;
  conversiones: number | null;
  /** null = CRM no integrado. */
  cierresCrm: number | null;
}

export interface Rendimiento {
  /** CPA frente a objetivo y equilibrio. */
  lectura: LecturaCampana;
  /** true => se muestra «rendimiento preliminar» (muestra pequena). Nunca true si no hay lectura valida. */
  preliminar: boolean;
  rentabilidad: EstadoRentabilidad;
  /** Cierres CRM informados (>= 0) o null si pendiente. */
  cierres: number | null;
}

export function evaluarRendimiento(e: EntradaRendimiento): Rendimiento {
  const lectura = clasificarCpa(e.cpa, e.objetivo, e.equilibrio);
  const cierres = fin(e.cierresCrm) && e.cierresCrm >= 0 ? e.cierresCrm : null;
  return {
    lectura,
    preliminar: lectura !== "datos_insuficientes" && muestraPequena(e.conversiones),
    // Con cierres CRM la rentabilidad pasa a revision humana; sin ellos, queda sin confirmar. Jamas «confirmada» aqui.
    rentabilidad: cierres !== null && cierres > 0 ? "en_revision" : "sin_confirmar",
    cierres,
  };
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

/** Frase de la lectura del CPA frente al objetivo (sin hablar de rentabilidad). */
export const FRASE_CPA: Record<LecturaCampana, string> = {
  bajo_objetivo: "CPA por debajo del objetivo",
  entre_objetivo_equilibrio: "CPA entre el objetivo y el equilibrio",
  sobre_equilibrio: "CPA sobre el equilibrio",
  datos_insuficientes: "Sin CPA, objetivo o equilibrio válidos",
};

/** Frescura: el dato es "desactualizado" si tiene mas de `umbralHoras` respecto de `ahora`. Fechas invalidas => desactualizado. */
export function estaDesactualizado(actualizado: string | null | undefined, ahora: string, umbralHoras = 36): boolean {
  const a = actualizado ? Date.parse(actualizado) : NaN;
  const n = Date.parse(ahora);
  if (!Number.isFinite(a) || !Number.isFinite(n)) return true;
  return n - a > umbralHoras * 3_600_000;
}
