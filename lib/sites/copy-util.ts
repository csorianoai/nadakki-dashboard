/** Idioma de las pantallas de Sites y utilidades de texto bilingue (patron de los copy.ts de lib/realtor). */
export type Lang = "es" | "en";

/** Texto bilingue de un copy.ts: 'es' obligatorio y 'en' obligatorio en la UI propia. */
export type Bi = { es: string; en: string };

/** Elige el idioma pedido; si falta o esta vacio, respalda a 'es'. */
export function pick(bi: { es: string; en?: string }, lang: Lang): string {
  if (lang === "en" && typeof bi.en === "string" && bi.en.trim() !== "") return bi.en;
  return bi.es;
}
