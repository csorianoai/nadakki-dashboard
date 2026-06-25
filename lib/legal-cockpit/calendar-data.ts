import type {
  CalendarEvent,
  ReminderItem,
  KpiCard,
} from "./types";

export const EVENT_STYLES: Record<
  string,
  { bg: string; border: string; text: string; subColor: string }
> = {
  audiencia: {
    bg: "rgba(139,92,246,0.15)",
    border: "#8B5CF6",
    text: "#D4C8FF",
    subColor: "#A78BFA",
  },
  plazo: {
    bg: "rgba(244,63,94,0.12)",
    border: "#F43F5E",
    text: "#FCA5A5",
    subColor: "#FB7185",
  },
  prox: {
    bg: "rgba(16,185,129,0.12)",
    border: "#10B981",
    text: "#A7F3D0",
    subColor: "#34D399",
  },
  interno: {
    bg: "rgba(59,130,246,0.10)",
    border: "#3B82F6",
    text: "#BFDBFE",
    subColor: "#60A5FA",
  },
};

export const HOUR_HEIGHT = 46;
export const START_HOUR = 8;
export const END_HOUR = 18;

export const WEEK_DAYS: { dow: string; num: number; today: boolean }[] = [
  { dow: "LUN", num: 23, today: false },
  { dow: "MAR", num: 24, today: true },
  { dow: "MIÉ", num: 25, today: false },
  { dow: "JUE", num: 26, today: false },
  { dow: "VIE", num: 27, today: false },
  { dow: "SÁB", num: 28, today: false },
  { dow: "DOM", num: 29, today: false },
];

export const RAW_EVENTS: CalendarEvent[] = [
  {
    id: "ev1", day: 0, start: 9, dur: 1.5, type: "audiencia",
    title: "Cobro de Pesos", sub: "Jdo. 1er Civil · STD",
    city: "STD · 3h viaje", conflict: true,
  },
  {
    id: "ev2", day: 0, start: 14, dur: 1, type: "plazo",
    title: "Contestación", sub: "CRD-2026-041",
    countdown: "en 2 días", conflict: true,
  },
  {
    id: "ev3", day: 1, start: 10.5, dur: 1.5, type: "audiencia",
    title: "Caso Laboral", sub: "Trib. Laboral · SDQ",
  },
  {
    id: "ev4", day: 2, start: 9, dur: 1.5, type: "audiencia",
    title: "Inmobiliario", sub: "Trib. de Tierras",
  },
  {
    id: "ev5", day: 3, start: 15, dur: 1, type: "plazo",
    title: "Vence KYC", sub: "CRD-2026-035",
    countdown: "en 4 días",
  },
];

export const DEMO_REMINDERS: ReminderItem[] = [
  { key: "a", title: "Audiencia mañana 9am", sub: "Mar 24 · Cobro de Pesos", on: true },
  { key: "b", title: "Plazo en 3 días", sub: "CRD-2026-041 · contestación", on: true },
  { key: "c", title: "Preparar traslado SDQ → STD", sub: "Salir antes de 6am", on: true },
];

export const KPI_CARDS: KpiCard[] = [
  {
    label: "CASOS ACTIVOS", value: 12, badge: "\u2191 3",
    sub: "3 nuevos esta semana", accentColor: "139,92,246",
    sparkPoints: "0,24 14,20 28,22 42,14 56,16 70,9 84,11 100,4",
  },
  {
    label: "PLAZOS URGENTES", value: 3, badge: "1 en 24h",
    sub: "1 vence en 24 horas", accentColor: "244,63,94",
    sparkPoints: "0,18 14,10 28,14 42,8 56,16 70,6 84,12 100,5",
  },
  {
    label: "DOCS PENDIENTES", value: 7, badge: "sin revisar",
    sub: "Requieren análisis IA", accentColor: "245,158,11",
    sparkPoints: "0,20 14,18 28,21 42,15 56,18 70,13 84,16 100,10",
  },
  {
    label: "AUDIENCIAS SEMANA", value: 4, badge: "2 pendientes",
    sub: "próxima mañana 9am", accentColor: "16,185,129",
    sparkPoints: "0,26 14,22 28,18 42,19 56,12 70,14 84,8 100,3",
  },
];

export const HEAT_BANDS = [
  { label: "Mañana", levels: [1, 2, 1, 3, 2, 0, 0] },
  { label: "Tarde", levels: [2, 4, 3, 4, 3, 1, 0] },
  { label: "Noche", levels: [1, 2, 2, 4, 3, 2, 1] },
];

export const HEAT_ALPHA = [0.06, 0.20, 0.38, 0.58, 0.85];

export const MONTH_EVENT_DOTS: Record<number, string[]> = {
  24: ["#8B5CF6", "#F43F5E"],
  25: ["#8B5CF6"],
  26: ["#8B5CF6"],
  27: ["#F43F5E"],
};

export const CIUDADES = [
  "Santo Domingo", "Santiago", "San Pedro", "La Romana", "Otra..."
] as const;
