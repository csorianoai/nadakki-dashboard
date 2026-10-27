export type EventKind = "cita" | "visita";
export const KINDS: readonly EventKind[] = ["cita", "visita"];

/** Día de la semana, 0 = lunes … 6 = domingo. */
export type CalEvent = {
  id: string;
  day: number;
  start: string; // "HH:MM"
  /** Fin en hora de pared de la zona del evento ("HH:MM", de ends_at). Sin ends_at legible no se inventa. */
  end?: string;
  title: { es: string; en: string };
  kind: EventKind;
  place: string;
};

/** Fair Housing: solo el tipo de evento. Ni idioma preferido ni clase protegida. */
export type CalFilter = EventKind | "todos";
