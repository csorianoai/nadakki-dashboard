import type { EventKind } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Smart Calendar: citas y visitas de la semana",
    intro: "Tus citas y visitas de lunes a domingo, en un solo lugar.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tengas citas o visitas agendadas aparecerán aquí.",
    fKind: "Tipo", all: "Todos", counts: "Eventos de la semana", week: "Semana", free: "Sin eventos",
    lang: "Idioma de la pantalla",
    fairHousing: "Cumplimiento de Fair Housing: el calendario filtra solo por tipo de evento. Nunca clase protegida.",
  },
  en: {
    title: "Smart Calendar: this week's appointments and showings",
    intro: "Your appointments and showings from Monday to Sunday, in one place.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once you have scheduled appointments or showings they will show up here.",
    fKind: "Type", all: "All", counts: "Events this week", week: "Week", free: "No events",
    lang: "Screen language",
    fairHousing: "Fair Housing compliance: the calendar filters only by event type. Never a protected class.",
  },
} as const;

export const DAYS: Record<Lang, readonly string[]> = {
  es: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};
export const KIND_LABEL: Record<Lang, Record<EventKind, string>> = {
  es: { cita: "Cita", visita: "Visita" },
  en: { cita: "Appointment", visita: "Showing" },
};
