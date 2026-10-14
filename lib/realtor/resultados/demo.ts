/** Datos SYNTH del centro Resultados: solo se usan con DEMO. Ninguna dimensión de clase protegida. */
export const FUNNEL_STAGES = ["leads", "contactados", "visitas", "ofertas", "cierres"] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const ORIGINS = ["portales", "referidos", "web", "redes"] as const;
export type Origin = (typeof ORIGINS)[number];

export type ResultadosData = {
  funnel: Record<FunnelStage, number>;
  /** Días medios que un negocio pasa en cada etapa antes de pasar a la siguiente. */
  avgDays: Record<Exclude<FunnelStage, "cierres">, number>;
  origins: Record<Origin, number>;
};

export const DEMO_RESULTADOS: ResultadosData = {
  funnel: { leads: 240, contactados: 168, visitas: 74, ofertas: 29, cierres: 12 },
  avgDays: { leads: 1.5, contactados: 4, visitas: 9, ofertas: 6 },
  origins: { portales: 96, referidos: 62, web: 51, redes: 31 },
};
