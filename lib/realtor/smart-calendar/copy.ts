import type { EventKind } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Smart Calendar: citas y visitas de la semana",
    intro: "Tus citas y visitas de lunes a domingo, en un solo lugar.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando agendes citas o visitas para esta semana aparecerán aquí.",
    fKind: "Tipo", all: "Todos", counts: "Eventos de la semana", week: "Semana", free: "Sin eventos",
    lang: "Idioma de la pantalla",
    weekNav: "Cambiar de semana", prev: "Anterior", prevAria: "Semana anterior", today: "Hoy", next: "Siguiente", nextAria: "Semana siguiente",
    now: "Ahora", schedule: "Programar visita", close: "Cerrar",
    menu: "Acciones de la visita", moveTitle: "Mover visita",
    fairHousing: "Cumplimiento de Fair Housing: el calendario filtra solo por tipo de evento. Nunca clase protegida.",
  },
  en: {
    title: "Smart Calendar: this week's appointments and showings",
    intro: "Your appointments and showings from Monday to Sunday, in one place.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Appointments and showings you schedule for this week will show up here.",
    fKind: "Type", all: "All", counts: "Events this week", week: "Week", free: "No events",
    lang: "Screen language",
    weekNav: "Change week", prev: "Previous", prevAria: "Previous week", today: "Today", next: "Next", nextAria: "Next week",
    now: "Now", schedule: "Schedule a showing", close: "Close",
    menu: "Visit actions", moveTitle: "Move showing",
    fairHousing: "Fair Housing compliance: the calendar filters only by event type. Never a protected class.",
  },
} as const;

export const DAYS: Record<Lang, readonly string[]> = {
  es: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};
/** Rótulo corto del encabezado de cada día («Lun 26»). */
export const DAYS_SHORT: Record<Lang, readonly string[]> = {
  es: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};
/** Locale de las fechas de cada idioma de la pantalla. */
export const LOCALE: Record<Lang, string> = { es: "es-ES", en: "en-US" };
export const KIND_LABEL: Record<Lang, Record<EventKind, string>> = {
  es: { cita: "Cita", visita: "Visita" },
  en: { cita: "Appointment", visita: "Showing" },
};
