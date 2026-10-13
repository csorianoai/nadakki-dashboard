/** Datos sintéticos de DEMO. Teléfonos 555-01xx, correos @example.invalid, nombres con prefijo SYNTH. Nunca reales. */
export type Metric = {
  id: string;
  label: { es: string; en: string };
  /** Sin fuente de datos hoy («SIN FUENTE HOY» en RE_METRIC_REGISTRY): se muestra NO_DISPONIBLE, también en DEMO. */
  source: boolean;
};

export const METRICS: readonly Metric[] = [
  { id: "licencia", label: { es: "Licencia y vencimiento", en: "License and expiry" }, source: true },
  { id: "supervision", label: { es: "Supervisión", en: "Supervision" }, source: true },
  { id: "meta-visitas", label: { es: "Meta de visitas del mes", en: "Monthly showings goal" }, source: true },
  { id: "meta-captaciones", label: { es: "Meta de captaciones", en: "Listings goal" }, source: true },
  { id: "meta-cierres", label: { es: "Cierres del año", en: "Closings this year" }, source: false },
  { id: "meta-ingresos", label: { es: "Ingresos por comisión", en: "Commission income" }, source: false },
];

/** Fecha de la foto sintética: fija para que los días restantes no cambien con el reloj. */
export const DEMO_AS_OF = "2026-10-13";

export const DEMO_LICENSE = {
  number: "SYNTH-SL-0100",
  jurisdiction: "SYNTH Florida",
  state: "expiring" as const,
  expiresOn: "2026-11-30",
  daysLeft: 48,
};

export const DEMO_SUPERVISION = {
  supervisor: "SYNTH Broker Demo",
  phone: "555-0100",
  email: "synth.broker@example.invalid",
  lastReview: "2026-09-15",
};

export const DEMO_GOALS: readonly { id: string; label: { es: string; en: string }; done: number; target: number }[] = [
  { id: "meta-visitas", label: { es: "Visitas del mes", en: "Showings this month" }, done: 14, target: 20 },
  { id: "meta-captaciones", label: { es: "Captaciones", en: "New listings" }, done: 3, target: 5 },
];
