import { LOCALE, type Lang } from "./copy";
import { weekRange } from "./api";
import type { CalEvent } from "./types";

/** Fecha local `n` días después de `d` (00:00). */
export const addDays = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Lunes 00:00 de la semana que está `offset` semanas después (o antes, si es negativo) de la de `today`. */
export const weekStart = (today: Date, offset: number): Date => addDays(weekRange(today).from, offset * 7);

/** Los siete días (lunes a domingo) de la semana que empieza en `monday`. */
export const weekDates = (monday: Date): Date[] => Array.from({ length: 7 }, (_, i) => addDays(monday, i));

export const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** «26 oct – 1 nov 2026» / «Oct 26 – Nov 1, 2026», con la locale del idioma. Espacios finos de ICU → espacio normal. */
export function formatWeekRange(monday: Date, lang: Lang): string {
  const sunday = addDays(monday, 6);
  const f = new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short", year: "numeric" });
  let s: string;
  try {
    s = f.formatRange(monday, sunday);
  } catch {
    s = `${f.format(monday)} – ${f.format(sunday)}`;
  }
  return s.replace(/\s+/g, " ");
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Hora local "HH:MM". */
export const hhmm = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Posición de la línea de «ahora»: antes del primer evento que empieza después de `now` ("HH:MM"); si no hay, al final. */
export function nowSlot(list: readonly CalEvent[], now: string): number {
  const i = list.findIndex((e) => e.start > now);
  return i === -1 ? list.length : i;
}
