import type { CalEvent, CalFilter } from "./types";

export const applyFilter = (list: readonly CalEvent[], f: CalFilter): CalEvent[] =>
  list.filter((e) => f === "todos" || e.kind === f);

/** Eventos de un día, ordenados por hora. */
export const eventsOfDay = (list: readonly CalEvent[], day: number): CalEvent[] =>
  list.filter((e) => e.day === day).sort((a, b) => a.start.localeCompare(b.start));

export const countByKind = (list: readonly CalEvent[]) => ({
  cita: list.filter((e) => e.kind === "cita").length,
  visita: list.filter((e) => e.kind === "visita").length,
});
