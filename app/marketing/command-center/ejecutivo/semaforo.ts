/**
 * Logica pura del semaforo economico de la pantalla. Reglas duras: nunca NaN/Infinity;
 * sin CPA, sin objetivo o sin equilibrio validos => "datos_insuficientes".
 *
 * SEMAFORO RESPONSABLE (criterio 3 de Cesar): «CPA por debajo del objetivo» NO es «rentabilidad confirmada».
 *   - Esta pantalla NUNCA confirma rentabilidad: solo ubica un CPA ya calculado frente a objetivo y equilibrio.
 *   - Tres estados de muestra (decision de Cesar, 10-nov-2026), segun las conversiones del periodo:
 *       0-4   => «Datos muy limitados» (sin juicio frente al objetivo)
 *       5-14  => «Rendimiento preliminar»
 *       15+   => «Muestra de seguimiento» CON INCERTIDUMBRE (no es rentabilidad confirmada)
 *   - Mientras no haya cierres reales del CRM, la rentabilidad queda «sin confirmar» (y con cierres, «en revision»).
 */
import type { LecturaCampana } from "./tipos";

/**
 * UMBRALES PROVISIONALES de muestra, aprobados por Cesar el 10-nov-2026.
 * NO son una prueba de significacion estadistica ni una confirmacion de rentabilidad: solo delimitan cuanto se puede decir
 * del CPA con las conversiones disponibles. Son constantes unicas: cambiarlas aqui cambia semaforo, KPI y textos.
 */
/** Hasta este numero de conversiones (inclusive): «datos muy limitados». */
export const MUESTRA_MUY_LIMITADA_MAX = 4;
/** Hasta este numero de conversiones (inclusive): «rendimiento preliminar». */
export const MUESTRA_PRELIMINAR_MAX = 14;
/** Desde este numero de conversiones: «muestra de seguimiento» (con incertidumbre). */
export const MUESTRA_SEGUIMIENTO_MIN = MUESTRA_PRELIMINAR_MAX + 1;

/** Menos de este numero de conversiones: sin CPA ni juicio de rentabilidad (texto del diseno aprobado). */
export const MIN_CONVERSIONES = MUESTRA_MUY_LIMITADA_MAX + 1;

export type EstadoMuestra = "muy_limitada" | "preliminar" | "seguimiento";

const fin = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);

export function clasificarCpa(cpa: number | null, objetivo: number | null, equilibrio: number | null): LecturaCampana {
  if (!fin(cpa) || !fin(objetivo) || !fin(equilibrio) || objetivo <= 0 || equilibrio <= 0 || equilibrio < objetivo) return "datos_insuficientes";
  if (cpa <= objetivo) return "bajo_objetivo";
  if (cpa <= equilibrio) return "entre_objetivo_equilibrio";
  return "sobre_equilibrio";
}

/**
 * Estado de la muestra segun las conversiones del periodo. Entrada invalida (null, undefined, NaN, negativa, infinita)
 * cae a «muy_limitada»: nunca lanza y nunca sube de estado por un dato que no se puede leer.
 */
export function estadoMuestra(conversiones: number | null | undefined): EstadoMuestra {
  if (!fin(conversiones) || conversiones < 0) return "muy_limitada";
  if (conversiones <= MUESTRA_MUY_LIMITADA_MAX) return "muy_limitada";
  if (conversiones <= MUESTRA_PRELIMINAR_MAX) return "preliminar";
  return "seguimiento";
}

/** true salvo en la muestra de seguimiento (compatibilidad: «muestra pequeña» = todo lo que aun no llega a 15). */
export function muestraPequena(conversiones: number | null): boolean {
  return estadoMuestra(conversiones) !== "seguimiento";
}

/** Etiqueta corta del estado de muestra (chip del CPA y titulo del semaforo). */
export const ETIQUETA_MUESTRA: Record<EstadoMuestra, string> = {
  muy_limitada: "Datos muy limitados",
  preliminar: "Rendimiento preliminar",
  seguimiento: "Muestra de seguimiento",
};

/**
 * Texto exacto que acompana al estado de muestra. En la muestra de seguimiento dice explicitamente que hay incertidumbre y que
 * NO es rentabilidad confirmada; en los otros dos nunca habla de confirmar nada.
 */
export function textoMuestra(conversiones: number | null | undefined, breve = false): string {
  const estado = estadoMuestra(conversiones);
  const n = fin(conversiones) && conversiones >= 0 ? conversiones : null;
  const cuenta = n === null ? "Conversiones no disponibles" : `${n} ${n === 1 ? "conversión" : "conversiones"}`;
  if (estado === "muy_limitada") return `${cuenta} · hacen falta al menos ${MIN_CONVERSIONES}`;
  // `breve` (movil): sin el rango entre parentesis, que consta completo en «Supuestos financieros y fuentes».
  if (estado === "preliminar") return breve ? `${cuenta} · muestra pequeña` : `${cuenta} · muestra pequeña (de ${MIN_CONVERSIONES} a ${MUESTRA_PRELIMINAR_MAX})`;
  return `${cuenta} · con incertidumbre: no es rentabilidad confirmada`;
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
  /** Estado de la muestra (0-4 muy limitada, 5-14 preliminar, 15+ seguimiento con incertidumbre). */
  muestra: EstadoMuestra;
  /** true => la muestra aun no es de seguimiento (muy limitada o preliminar). Nunca true si no hay lectura valida. */
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
    muestra: estadoMuestra(e.conversiones),
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

/**
 * Lectura de una campana para la tabla: el CPA frente al objetivo NUNCA va sola; lleva el estado de su muestra
 * («Preliminar: bajo objetivo», «Seguimiento: bajo objetivo»). Con menos de 5 conversiones: «Datos insuficientes», sin juicio.
 */
export function lecturaCampana(lectura: LecturaCampana, conversiones: number | null | undefined): string {
  const muestra = estadoMuestra(conversiones);
  if (lectura === "datos_insuficientes" || muestra === "muy_limitada") return ETIQUETA_LECTURA.datos_insuficientes;
  const frase = ETIQUETA_LECTURA[lectura].toLowerCase();
  return muestra === "preliminar" ? `Preliminar: ${frase}` : `Seguimiento: ${frase}`;
}

/** Con «datos muy limitados» (menos de 5 conversiones) no se emite juicio frente al objetivo. */
export const FRASE_SIN_JUICIO = "Sin juicio frente al objetivo";

/** Frase del CPA frente al objetivo segun el estado de la muestra (nunca habla de rentabilidad). */
export function fraseCpa(lectura: LecturaCampana, muestra: EstadoMuestra): string {
  return muestra === "muy_limitada" ? FRASE_SIN_JUICIO : FRASE_CPA[lectura];
}

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
