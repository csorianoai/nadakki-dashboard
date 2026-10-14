import type { CalEvent } from "./types";

/** Datos sintéticos (prefijo SYNTH). Solo con NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1". */
export const DEMO_EVENTS: readonly CalEvent[] = [
  { id: "e1", day: 0, start: "10:00", kind: "visita", place: "Sunny Isles Beach", title: { es: "SYNTH Visita 1", en: "SYNTH Showing 1" } },
  { id: "e2", day: 1, start: "09:30", kind: "cita", place: "Oficina", title: { es: "SYNTH Cita 2 · firma de encargo", en: "SYNTH Appointment 2 · listing signing" } },
  { id: "e3", day: 2, start: "16:00", kind: "visita", place: "Aventura", title: { es: "SYNTH Visita 3", en: "SYNTH Showing 3" } },
  { id: "e4", day: 3, start: "11:00", kind: "cita", place: "Videollamada", title: { es: "SYNTH Cita 4 · revisión de oferta", en: "SYNTH Appointment 4 · offer review" } },
  { id: "e5", day: 3, start: "15:30", kind: "visita", place: "Bal Harbour", title: { es: "SYNTH Visita 5", en: "SYNTH Showing 5" } },
  { id: "e6", day: 5, start: "12:00", kind: "visita", place: "Sunny Isles Beach", title: { es: "SYNTH Visita 6 · puertas abiertas", en: "SYNTH Showing 6 · open house" } },
];
