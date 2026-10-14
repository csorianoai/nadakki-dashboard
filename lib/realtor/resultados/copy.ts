import type { FunnelStage, Origin } from "./demo";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Resultados",
    intro: "Del primer contacto al cierre: cuántos leads avanzan, cuánto tarda cada etapa y de dónde llegan.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tengas leads y cierres registrados verás aquí el embudo, los tiempos y los orígenes.",
    funnel: "Embudo de leads a cierres", days: "Tiempo medio por etapa", origins: "Origen de los leads",
    daysUnit: "días", conversion: "Conversión de leads a cierres", lang: "Idioma de la pantalla",
  },
  en: {
    title: "Results",
    intro: "From first contact to closing: how many leads move forward, how long each stage takes and where they come from.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once you have leads and closings registered, the funnel, timings and sources will show up here.",
    funnel: "Leads-to-closings funnel", days: "Average time per stage", origins: "Lead sources",
    daysUnit: "days", conversion: "Lead-to-closing conversion", lang: "Screen language",
  },
} as const;

export const STAGE_LABEL: Record<Lang, Record<FunnelStage, string>> = {
  es: { leads: "Leads", contactados: "Contactados", visitas: "Visitas", ofertas: "Ofertas", cierres: "Cierres" },
  en: { leads: "Leads", contactados: "Contacted", visitas: "Viewings", ofertas: "Offers", cierres: "Closings" },
};

export const ORIGIN_LABEL: Record<Lang, Record<Origin, string>> = {
  es: { portales: "Portales", referidos: "Referidos", web: "Web propia", redes: "Redes sociales" },
  en: { portales: "Portals", referidos: "Referrals", web: "Own website", redes: "Social media" },
};
